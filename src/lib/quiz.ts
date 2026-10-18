import "server-only";
import { cache } from "react";
import { randomInt } from "node:crypto";
import { Client } from "@notionhq/client";
import {
  getCategoryMap,
  getDataSourceId,
  getPageRecordMap,
  getPublishedPosts,
} from "@/lib/notion";
import type { QuizCategory, QuizQuestion } from "@/lib/quiz-types";
import { cacheNotion } from "@/lib/notion-cache";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

type QuizPage = {
  id: string;
  public_url?: string | null;
  properties: {
    제목?: { title: { plain_text: string }[] };
    카테고리?: { relation: { id: string }[]; has_more?: boolean; id: string };
    참고?: { relation: { id: string }[]; has_more?: boolean; id: string };
  };
};

const normalizeId = (id: string) => id.replaceAll("-", "").toLowerCase();

async function relationIds(pageId: string, property: QuizPage["properties"]["참고"]) {
  if (!property) return [];
  if (!property.has_more) return property.relation.map((item) => item.id);
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.pages.properties.retrieve({
      page_id: pageId,
      property_id: property.id,
      start_cursor: cursor,
    });
    if (response.object !== "list") throw new Error("퀴즈 관계 속성을 읽지 못했습니다.");
    for (const item of response.results) {
      if (item.type === "relation") ids.push(item.relation.id);
    }
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return ids;
}

const getQuizPages = cache(cacheNotion("quiz-pages", async (): Promise<QuizPage[]> => {
  const databaseId = process.env.NOTION_QUIZ_DATABASE_ID;
  if (!databaseId) return [];
  const dataSourceId = await getDataSourceId(databaseId);
  const pages: QuizPage[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    pages.push(...(response.results as QuizPage[]).filter((page) => page.public_url));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}));

export const getQuizCatalog = cache(async () => {
  const [pages, categoryMap] = await Promise.all([getQuizPages(), getCategoryMap()]);
  const labels = new Map<string, string>();
  const questions: QuizQuestion[] = await Promise.all(pages.map(async (page) => {
    const categoryIds = new Set<string>();
    const names = new Set<string>();
    for (const id of await relationIds(page.id, page.properties.카테고리)) {
      const path: { id: string; name: string }[] = [];
      const visited = new Set<string>();
      let row = categoryMap.get(id);
      while (row && !visited.has(row.id)) {
        visited.add(row.id);
        path.unshift(row);
        row = row.parentId ? categoryMap.get(row.parentId) : undefined;
      }
      path.forEach((item) => {
        categoryIds.add(item.id);
        labels.set(item.id, item.name);
      });
      if (path.length) names.add(path[path.length - 1].name);
    }
    return {
      id: page.id,
      title: page.properties.제목?.title.map((item) => item.plain_text).join("") || "(제목 없음)",
      categoryIds: [...categoryIds],
      categoryNames: names.size ? [...names] : ["미분류"],
    };
  }));
  const categories: QuizCategory[] = [...labels].map(([id, label]) => ({
    id, label, count: questions.filter((question) => question.categoryIds.includes(id)).length,
  })).sort((a, b) => a.label.localeCompare(b.label, "ko"));
  const unclassified = questions.filter((question) => question.categoryIds.length === 0).length;
  if (unclassified) categories.push({ id: "uncategorized", label: "미분류", count: unclassified });
  return { questions, categories };
});

export function createQuizDeck(questions: QuizQuestion[], category: string) {
  const deck = questions.filter((question) => !category || (
    category === "uncategorized" ? question.categoryIds.length === 0 : question.categoryIds.includes(category)
  ));
  // 선택 시점의 후보를 섞어 한 회차에서 각 문제를 한 번씩만 보여준다.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export async function getQuizAnswer(id: string) {
  const pages = await getQuizPages();
  const page = pages.find((item) => normalizeId(item.id) === normalizeId(id));
  if (!page) return null;
  const [recordMap, referenceIds, posts] = await Promise.all([
    getPageRecordMap(page.id),
    relationIds(page.id, page.properties.참고),
    getPublishedPosts(),
  ]);
  const allowed = new Set(referenceIds.map(normalizeId));
  return {
    recordMap,
    references: posts.filter((post) => allowed.has(normalizeId(post.id)))
      .map(({ id, title, slug }) => ({ id, title, slug })),
  };
}
