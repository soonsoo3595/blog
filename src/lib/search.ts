import "server-only";
import {
  getBlockValue,
  getPageContentBlockIds,
  getTextContent,
} from "notion-utils";
import type { ExtendedRecordMap } from "notion-types";
import { getPublishedPosts, getPageRecordMap } from "@/lib/notion";

const MEILISEARCH_HOST =
  process.env.MEILISEARCH_HOST ?? "http://localhost:17700";
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY ?? "";
const INDEX_NAME = "posts";

export type SearchHit = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
};

function meiliFetch(path: string, init?: RequestInit) {
  return fetch(`${MEILISEARCH_HOST}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${MEILISEARCH_API_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

function extractPlainText(recordMap: ExtendedRecordMap, pageId: string): string {
  const blockIds = getPageContentBlockIds(recordMap, pageId);

  return blockIds
    .map((id) => {
      const block = getBlockValue(recordMap.block[id]);
      const title = block?.properties?.title as
        | Parameters<typeof getTextContent>[0]
        | undefined;
      return title ? getTextContent(title) : "";
    })
    .filter(Boolean)
    .join("\n");
}

export async function reindexPosts(): Promise<number> {
  const posts = await getPublishedPosts();

  const documents = await Promise.all(
    posts.map(async (post) => {
      const recordMap = await getPageRecordMap(post.id);
      const content = extractPlainText(recordMap, post.id);

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        category: post.categoryPath.join(" > "),
        date: post.date,
        content,
      };
    }),
  );

  await meiliFetch(`/indexes/${INDEX_NAME}/documents`, {
    method: "PUT",
    body: JSON.stringify(documents),
  });

  return documents.length;
}

export async function searchPosts(query: string): Promise<SearchHit[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const res = await meiliFetch(`/indexes/${INDEX_NAME}/search`, {
      method: "POST",
      body: JSON.stringify({
        q: query,
        limit: 8,
        attributesToRetrieve: ["id", "slug", "title", "category", "date"],
      }),
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as { hits: SearchHit[] };
    return data.hits;
  } catch {
    // Meilisearch(홈서버 터널)가 안 떠 있어도 검색창은 그냥 결과 없음으로 처리
    return [];
  }
}
