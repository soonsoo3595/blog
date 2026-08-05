import "server-only";
import { Client } from "@notionhq/client";
import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
// 공개 페이지라도 서버에서 브라우저 흉내를 안 내면(User-Agent 없음 등) 노션의
// 봇 차단에 걸려 403이 나는 경우가 있어, 일반 브라우저처럼 보이는 헤더를 붙인다.
const notionApi = new NotionAPI({
  ofetchOptions: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  },
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
};

// Notion API 응답의 page 객체는 속성 타입이 매우 복잡하므로, 실제 사용하는
// 속성(제목/슬러그/카테고리/날짜)만 좁혀서 쓴다.
type NotionPage = {
  id: string;
  properties: {
    제목?: { title?: { plain_text: string }[] };
    슬러그?: { rich_text?: { plain_text: string }[] };
    카테고리?: { select?: { name: string } | null };
    날짜?: { date?: { start: string } | null };
  };
};

function toPost(page: NotionPage): Post {
  const props = page.properties;
  return {
    id: page.id,
    title: props["제목"]?.title?.[0]?.plain_text ?? "(제목 없음)",
    slug: props["슬러그"]?.rich_text?.[0]?.plain_text ?? page.id,
    category: props["카테고리"]?.select?.name ?? "미분류",
    date: props["날짜"]?.date?.start ?? "",
  };
}

// Notion API는 2025년부터 하나의 database가 여러 data source를 가질 수 있게
// 바뀌어서, database_id로 바로 쿼리하지 못하고 그 안의 data source id를
// 먼저 조회해야 한다. 자주 바뀌지 않는 값이라 프로세스 내에서 캐싱해둔다.
let cachedDataSourceId: string | null = null;

async function getDataSourceId(): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId;

  const database = await notion.databases.retrieve({
    database_id: DATABASE_ID,
  });
  const dataSourceId = (
    database as { data_sources?: { id: string }[] }
  ).data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error(
      "Notion 데이터베이스에서 data source id를 찾지 못했습니다. NOTION_DATABASE_ID를 확인하세요.",
    );
  }

  cachedDataSourceId = dataSourceId;
  return dataSourceId;
}

export async function getPublishedPosts(): Promise<Post[]> {
  const dataSourceId = await getDataSourceId();
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "상태",
      select: { equals: "공개" },
    },
    sorts: [{ property: "날짜", direction: "descending" }],
  });
  return (res.results as NotionPage[]).map(toPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const dataSourceId = await getDataSourceId();
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        { property: "슬러그", rich_text: { equals: slug } },
        { property: "상태", select: { equals: "공개" } },
      ],
    },
  });
  const page = res.results[0] as NotionPage | undefined;
  if (page) return toPost(page);

  // "슬러그" 속성이 비어있는 글은 목록에서 노션 페이지 id를 그대로 URL로
  // 쓰게 되는데, 그 경우를 위해 페이지 id로도 조회를 시도한다.
  try {
    const fallbackPage = (await notion.pages.retrieve({
      page_id: slug,
    })) as NotionPage;
    const post = toPost(fallbackPage);
    return post.slug === slug || fallbackPage.id === slug ? post : null;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<string[]> {
  const posts = await getPublishedPosts();
  return Array.from(new Set(posts.map((p) => p.category)));
}

export async function getPageRecordMap(
  pageId: string,
): Promise<ExtendedRecordMap> {
  return notionApi.getPage(pageId);
}
