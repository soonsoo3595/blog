import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

function loadTypeScript(file, dependencies) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const compiledModule = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: compiledModule.exports,
    module: compiledModule,
    process: { env: { NOTION_DATABASE_ID: "posts", NOTION_CATEGORY_DATABASE_ID: "categories" } },
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`예상하지 못한 의존성: ${name}`);
    },
  });
  return compiledModule.exports;
}

function page(id, { published = true, relations, hasMore = false, slug = id } = {}) {
  return {
    id,
    public_url: published ? `https://notion.so/${id}` : null,
    properties: {
      제목: { title: [{ plain_text: `글 ${id}` }] },
      슬러그: { rich_text: slug ? [{ plain_text: slug }] : [] },
      ...(relations ? { "관련 포스트": { id: "related", relation: relations.map((id) => ({ id })), has_more: hasMore } } : {}),
    },
  };
}

function setup(pages, propertyPages = []) {
  const propertyCalls = [];
  const client = {
    databases: { retrieve: async ({ database_id }) => ({ data_sources: [{ id: database_id }] }) },
    dataSources: { query: async ({ data_source_id }) => ({ results: data_source_id === "posts" ? pages : [], has_more: false }) },
    pages: { properties: { retrieve: async (args) => {
      propertyCalls.push(args);
      return propertyPages[propertyCalls.length - 1];
    } } },
  };
  const lib = loadTypeScript("src/lib/notion.ts", {
    "server-only": {},
    "@/lib/notion-cache": { cacheNotion: (_name, fn) => fn },
    react: { cache: (fn) => fn },
    "@notionhq/client": { Client: class { constructor() { return client; } } },
    "notion-client": { NotionAPI: class {} },
  });
  return { ...lib, propertyCalls };
}

test("관계 순서를 유지하고 비공개·외부·삭제·자기 자신·중복 글을 제외한다", async () => {
  const { getRelatedPosts } = setup([
    page("aa-aa", { relations: ["cccc", "bbbb", "private", "outside", "deleted", "AAAA", "BBBB"] }),
    page("bb-bb", { slug: "second" }),
    page("cc-cc", { slug: "" }),
    page("private", { published: false }),
  ]);
  const result = await getRelatedPosts("aa-aa");
  assert.deepEqual(Array.from(result, (post) => post.id), ["cc-cc", "bb-bb"]);
  assert.deepEqual(Array.from(result, (post) => post.slug), ["cc-cc", "second"]);
});

test("속성이 없거나 관계가 비었거나 공개 대상이 없으면 빈 목록을 반환한다", async () => {
  const { getRelatedPosts } = setup([
    page("missing"),
    page("empty", { relations: [] }),
    page("hidden-only", { relations: ["private"] }),
    page("private", { published: false }),
  ]);
  for (const id of ["missing", "empty", "hidden-only", "unknown"]) {
    assert.equal((await getRelatedPosts(id)).length, 0);
  }
});

test("공개 글을 기준으로 페이지를 나누고 목록에서 슬러그와 페이지 ID를 조회한다", async () => {
  const { getPublishedPostsPage, getPostBySlug } = setup([
    page("private", { published: false }),
    page("aa-aa", { slug: "first" }),
    page("bb-bb", { slug: "" }),
    page("cc-cc", { slug: "third" }),
  ]);
  const first = await getPublishedPostsPage(1, 2);
  assert.deepEqual(Array.from(first.posts, (post) => post.id), ["aa-aa", "bb-bb"]);
  assert.equal(first.hasNextPage, true);
  const second = await getPublishedPostsPage(2, 2);
  assert.deepEqual(Array.from(second.posts, (post) => post.id), ["cc-cc"]);
  assert.equal(second.hasNextPage, false);
  assert.equal((await getPostBySlug("first")).id, "aa-aa");
  assert.equal((await getPostBySlug("BBBB")).id, "bb-bb");
  assert.equal(await getPostBySlug("private"), null);
  assert.equal(await getPostBySlug("unknown"), null);
});

test("잘린 관계는 속성 API의 다음 커서까지 조회한다", async () => {
  const targets = Array.from({ length: 27 }, (_, i) => `target-${i}`);
  const { getRelatedPosts, propertyCalls } = setup([
    page("source", { relations: targets.slice(0, 25), hasMore: true }),
    ...targets.map((id) => page(id)),
  ], [
    { object: "list", results: targets.slice(0, 25).map((id) => ({ type: "relation", relation: { id } })), has_more: true, next_cursor: "next" },
    { object: "list", results: targets.slice(25).map((id) => ({ type: "relation", relation: { id } })), has_more: false, next_cursor: null },
  ]);
  assert.deepEqual(Array.from(await getRelatedPosts("source"), (post) => post.id), targets);
  assert.equal(propertyCalls.length, 2);
  assert.equal(propertyCalls[1].start_cursor, "next");
  assert.equal(propertyCalls[1].property_id, "related");
});

test("관련 글 UI는 빈 목록을 숨기고 블로그 내부 링크와 제목을 렌더링한다", () => {
  const { default: RelatedPosts } = loadTypeScript("src/components/RelatedPosts.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
  });
  assert.equal(renderToStaticMarkup(React.createElement(RelatedPosts, { posts: [] })), "");
  const html = renderToStaticMarkup(React.createElement(RelatedPosts, {
    posts: [{ id: "id", slug: "related-slug", title: "관련 문서", categoryPath: ["개발", "웹"] }],
  }));
  assert.match(html, /관련 포스트/);
  assert.match(html, /href="\/posts\/related-slug"/);
  assert.match(html, /관련 문서/);
  assert.match(html, /개발 &gt; 웹/);
});
