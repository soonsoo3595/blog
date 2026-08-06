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
  parentCategory: string;
  date: string;
};

// Notion API 응답의 page 객체는 속성 타입이 매우 복잡하므로, 실제 사용하는
// 속성(제목/슬러그/카테고리/상위카테고리/날짜)만 좁혀서 쓴다.
// public_url: "웹에 게시"가 켜진 페이지만 값이 채워지는 page 최상위 필드.
// notion-client(비공식 API)로 본문을 가져올 수 있는 조건과 정확히 일치해서,
// 별도 "상태"(공개/비공개) 속성 없이 이 값 하나로 공개 여부를 판단한다.
type NotionPage = {
  id: string;
  public_url?: string | null;
  properties: {
    제목?: { title?: { plain_text: string }[] };
    슬러그?: { rich_text?: { plain_text: string }[] };
    카테고리?: { select?: { name: string } | null };
    상위카테고리?: { select?: { name: string } | null };
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
    parentCategory: props["상위카테고리"]?.select?.name ?? "",
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
    sorts: [{ property: "날짜", direction: "descending" }],
  });
  return (res.results as NotionPage[])
    .filter((page) => page.public_url != null)
    .map(toPost);
}

// category는 "카테고리"(하위) 값일 수도, "상위카테고리" 값일 수도 있다
// (CategoryList에서 둘 다 같은 /categories/[category] 경로로 링크함) — 둘 중
// 하나라도 일치하면 매칭한다.
// Notion select 필터는 값이 "그 속성에 실제 존재하는 옵션"이 아니면 API가
// validation_error(400)를 던진다 — "카테고리"에만 있는 값으로 "상위카테고리"를
// 필터링하면 에러가 나므로, 쿼리 필터 대신 전체 글을 가져와 코드에서 매칭한다.
export async function getPostsByCategory(category: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter(
    (post) => post.category === category || post.parentCategory === category,
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const dataSourceId = await getDataSourceId();
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { property: "슬러그", rich_text: { equals: slug } },
  });
  const page = res.results[0] as NotionPage | undefined;
  if (page) return page.public_url != null ? toPost(page) : null;

  // "슬러그" 속성이 비어있는 글은 목록에서 노션 페이지 id를 그대로 URL로
  // 쓰게 되는데, 그 경우를 위해 페이지 id로도 조회를 시도한다.
  try {
    const fallbackPage = (await notion.pages.retrieve({
      page_id: slug,
    })) as NotionPage;
    if (fallbackPage.public_url == null) return null;
    const post = toPost(fallbackPage);
    return post.slug === slug || fallbackPage.id === slug ? post : null;
  } catch {
    return null;
  }
}

export type CategoryGroup = {
  name: string;
  subCategories: string[];
};

// "카테고리"(하위)를 "상위카테고리" 기준으로 묶어 트리 형태로 반환한다.
// 노션 Select 속성엔 계층 개념이 없어서, 두 속성을 각 글에 따로 지정해두고
// 여기서 코드로 조합하는 방식이다.
// "상위카테고리"가 비어있는 글은 "카테고리" 값 자체가 최상위(루트) 항목이 된다
// (하위 항목 없는 groups 엔트리로 표현됨) — 별도 미분류 그룹으로 묶지 않는다.
export async function getCategories(): Promise<CategoryGroup[]> {
  const posts = await getPublishedPosts();
  const groups = new Map<string, Set<string>>();

  for (const post of posts) {
    if (post.parentCategory) {
      if (!groups.has(post.parentCategory)) {
        groups.set(post.parentCategory, new Set());
      }
      groups.get(post.parentCategory)!.add(post.category);
    } else if (!groups.has(post.category)) {
      groups.set(post.category, new Set());
    }
  }

  return Array.from(groups.entries()).map(([name, subCategories]) => ({
    name,
    subCategories: Array.from(subCategories),
  }));
}

export async function getPageRecordMap(
  pageId: string,
): Promise<ExtendedRecordMap> {
  return notionApi.getPage(pageId);
}
