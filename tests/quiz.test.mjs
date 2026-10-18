import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function setup(pages, { propertyPages = [], posts = [] } = {}) {
  const calls = { page: 0, relation: 0, answer: 0 };
  const categories = new Map([
    ["root", { id: "root", name: "개발", parentId: null }],
    ["web", { id: "web", name: "웹", parentId: "root" }],
    ["other", { id: "other", name: "일상", parentId: null }],
  ]);
  const client = {
    dataSources: { query: async () => {
      calls.page++;
      return { results: pages, has_more: false };
    } },
    pages: { properties: { retrieve: async () => propertyPages[calls.relation++] } },
  };
  const dependencies = {
    "server-only": {},
    "@/lib/notion-cache": { cacheNotion: (_name, fn) => fn },
    react: { cache: (fn) => fn },
    "node:crypto": { randomInt: () => 0 },
    "@notionhq/client": { Client: class { constructor() { return client; } } },
    "@/lib/notion": {
      getDataSourceId: async () => "source",
      getCategoryMap: async () => categories,
      getPublishedPosts: async () => posts,
      getPageRecordMap: async () => { calls.answer++; return { block: {} }; },
    },
  };
  const source = readFileSync(new URL("../src/lib/quiz.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } });
  const compiledModule = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: compiledModule.exports,
    module: compiledModule,
    process: { env: { NOTION_QUIZ_DATABASE_ID: "quiz-db" } },
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`예상하지 못한 의존성: ${name}`);
    },
  });
  return { ...compiledModule.exports, calls };
}

function quiz(id, { published = true, categories = ["web"], references = [], truncated = false } = {}) {
  return {
    id,
    public_url: published ? `https://notion.so/${id}` : null,
    properties: {
      제목: { title: [{ plain_text: "문제 " }, { plain_text: id }] },
      카테고리: { id: "category", relation: categories.map((id) => ({ id })) },
      참고: { id: "reference", relation: references.map((id) => ({ id })), has_more: truncated },
    },
  };
}

test("카테고리별 문제 수에는 하위 카테고리를 포함하고 비공개 문제·답 본문은 제외한다", async () => {
  const { getQuizCatalog, calls } = setup([
    quiz("one"), quiz("two", { categories: ["root", "web"] }),
    quiz("hidden", { published: false }), quiz("three", { categories: [] }),
  ]);
  const { questions, categories } = await getQuizCatalog();
  assert.equal(questions.length, 3);
  assert.equal(questions[0].title, "문제 one");
  assert.deepEqual(Array.from(questions[0].categoryIds), ["root", "web"]);
  assert.deepEqual(Array.from(questions[0].categoryNames), ["웹"]);
  assert.equal(categories.find((category) => category.id === "web").label, "웹");
  assert.equal(categories.find((category) => category.id === "root").count, 2);
  assert.equal(categories.find((category) => category.id === "uncategorized").count, 1);
  assert.equal(calls.answer, 0);
});

test("선택한 카테고리의 후보를 중복 없이 섞고 원본 목록을 유지한다", async () => {
  const { getQuizCatalog, createQuizDeck } = setup([quiz("one"), quiz("two"), quiz("other", { categories: ["other"] }), quiz("none", { categories: [] })]);
  const { questions } = await getQuizCatalog();
  assert.deepEqual(Array.from(createQuizDeck(questions, "root"), (question) => question.id).sort(), ["one", "two"]);
  assert.deepEqual(Array.from(createQuizDeck(questions, "other"), (question) => question.id), ["other"]);
  assert.deepEqual(Array.from(createQuizDeck(questions, "uncategorized"), (question) => question.id), ["none"]);
  assert.equal(createQuizDeck(questions, "missing").length, 0);
  assert.equal(createQuizDeck([], "").length, 0);
  const all = createQuizDeck(questions, "");
  assert.equal(new Set(all.map((question) => question.id)).size, questions.length);
  assert.deepEqual(Array.from(questions, (question) => question.id), ["one", "two", "other", "none"]);
});

test("공개된 퀴즈의 답만 제공하고 공개 블로그 글만 참고 링크로 연결한다", async () => {
  const { getQuizAnswer, calls } = setup([
    quiz("public", { references: ["post", "private", "outside"], truncated: true }),
    quiz("private", { published: false }),
  ], {
    propertyPages: [
      { object: "list", results: [{ type: "relation", relation: { id: "post" } }], has_more: true, next_cursor: "next" },
      { object: "list", results: [{ type: "relation", relation: { id: "outside" } }], has_more: false },
    ],
    posts: [{ id: "post", title: "참고 글", slug: "reference" }],
  });
  assert.equal(await getQuizAnswer("private"), null);
  assert.equal(calls.answer, 0);
  const answer = await getQuizAnswer("public");
  assert.equal(calls.answer, 1);
  assert.equal(calls.relation, 2);
  assert.deepEqual(Array.from(answer.references, (post) => post.slug), ["reference"]);
});
