import "server-only";
import { cache } from "react";
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
const CATEGORY_DATABASE_ID = process.env.NOTION_CATEGORY_DATABASE_ID!;

export type Post = {
  id: string;
  title: string;
  slug: string;
  // 카테고리 DB의 "상위카테고리"(부모 관계)를 루트부터 리프까지 따라간 이름
  // 목록. 예: ["개발", "게임", "언리얼"]. 카테고리가 없으면 ["미분류"].
  categoryPath: string[];
  date: string;
  cover: string | null;
};

// Notion API 응답의 page 객체는 속성 타입이 매우 복잡하므로, 실제 사용하는
// 속성(제목/슬러그/카테고리/날짜)만 좁혀서 쓴다.
// public_url: "웹에 게시"가 켜진 페이지만 값이 채워지는 page 최상위 필드.
// notion-client(비공식 API)로 본문을 가져올 수 있는 조건과 정확히 일치해서,
// 별도 "상태"(공개/비공개) 속성 없이 이 값 하나로 공개 여부를 판단한다.
// cover: 페이지 상단 커버 이미지. "file" 타입(노션에 직접 업로드)이면 signed URL이라
// 1시간 정도 후 만료되지만, 우리 페이지들이 요청마다 새로 렌더링돼서(캐싱 안 함)
// 매번 신선한 URL을 받아오므로 실제로는 문제 안 됨 — 나중에 ISR 등 캐싱을 도입하면
// 이 부분을 다시 고려할 것.
type NotionPage = {
  id: string;
  public_url?: string | null;
  cover?: {
    type: "external" | "file";
    external?: { url: string };
    file?: { url: string };
  } | null;
  properties: {
    제목?: { title?: { plain_text: string }[] };
    슬러그?: { rich_text?: { plain_text: string }[] };
    // 재귀적 계층(개발 > 게임 > 언리얼 등)을 지원하려고 별도 "카테고리" 데이터베이스를
    // 만들고, 글 쪽 "카테고리"는 그 DB를 가리키는 Relation으로 바꿈(글 DB ↔ 카테고리
    // DB는 서로 다른 DB라 self-relation 방향성 문제가 없음 — 아래 CategoryRow 주석
    // 참고). 실제 이름/상위 관계는 카테고리 DB 쪽에서 가져온 맵으로 풀어야 함.
    카테고리?: { relation?: { id: string }[] };
    "관련 포스트"?: {
      id: string;
      relation: { id: string }[];
      has_more?: boolean;
    };
    // "날짜" 속성을 노션 자동 "생성 일시"(Created time) 타입으로 바꿔서, 응답 구조가
    // 일반 date 속성(`{ date: { start } }`)이 아니라 `{ created_time: "ISO문자열" }`.
    날짜?: { created_time?: string };
  };
};

// 카테고리 DB의 한 행. parentId가 null이면 최상위 카테고리.
// "상위카테고리"는 노션의 "하위 항목"(Sub-items) 기능으로 만든 짝 속성인
// "상위 항목"(Parent item)을 이름만 "상위카테고리"로 바꿔서 쓴다 — 진짜 Relation.
// 처음엔 이걸 수동 self-relation(Relation 속성 하나만 직접 추가)으로 만들었다가,
// 노션이 양방향으로 동기화해서(C++의 상위카테고리를 개발로 지정하면 개발의
// 상위카테고리에도 자동으로 C++이 채워짐) 부모/자식 방향을 구분 못 하는 문제를
// 겪었다. 반면 "하위 항목" 기능은 "상위 항목"(부모, 우리가 직접 편집)과
// "하위 항목"(자식 목록, 반대 방향 읽기 전용 뷰)을 처음부터 별개 속성으로 분리해
// 만들어줘서 같은 문제가 없다. (중간에 Select+부모이름 텍스트로 우회했던 적도
// 있었으나, 이 방식이 오타 위험 없이 더 낫다.)
type CategoryRow = {
  id: string;
  name: string;
  parentId: string | null;
};

type CategoryMap = Map<string, CategoryRow>;

// categoryId부터 "상위카테고리"를 타고 올라가 루트까지의 이름을 [루트, ..., 리프]
// 순서로 반환한다. 카테고리가 없거나 맵에서 못 찾으면 ["미분류"].
function resolveCategoryPath(
  categoryId: string | undefined,
  categoryMap: CategoryMap,
): string[] {
  const path: string[] = [];
  const visited = new Set<string>();
  let current = categoryId ? categoryMap.get(categoryId) : undefined;

  // "하위 항목" 기능을 쓰면 정상적으로는 순환이 생길 수 없지만, 혹시 모를 실수
  // 대비로 이미 지나온 id를 다시 만나면 멈춰서 무한루프를 막는다.
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current.name);
    current = current.parentId ? categoryMap.get(current.parentId) : undefined;
  }

  return path.length > 0 ? path : ["미분류"];
}

function toPost(page: NotionPage, categoryMap: CategoryMap): Post {
  const props = page.properties;
  return {
    id: page.id,
    title: props["제목"]?.title?.[0]?.plain_text ?? "(제목 없음)",
    slug: props["슬러그"]?.rich_text?.[0]?.plain_text ?? page.id,
    categoryPath: resolveCategoryPath(
      props["카테고리"]?.relation?.[0]?.id,
      categoryMap,
    ),
    date: props["날짜"]?.created_time ?? "",
    cover: page.cover?.external?.url ?? page.cover?.file?.url ?? null,
  };
}

// Notion API는 2025년부터 하나의 database가 여러 data source를 가질 수 있게
// 바뀌어서, database_id로 바로 쿼리하지 못하고 그 안의 data source id를
// 먼저 조회해야 한다. 자주 바뀌지 않는 값이라 프로세스 내에서 캐싱해둔다.
// 글 DB/카테고리 DB 둘 다 써서 database_id별로 캐싱한다.
const dataSourceIdCache = new Map<string, string>();

async function getDataSourceId(databaseId: string): Promise<string> {
  const cached = dataSourceIdCache.get(databaseId);
  if (cached) return cached;

  const database = await notion.databases.retrieve({
    database_id: databaseId,
  });
  const dataSourceId = (
    database as { data_sources?: { id: string }[] }
  ).data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error(
      `Notion 데이터베이스(${databaseId})에서 data source id를 찾지 못했습니다.`,
    );
  }

  dataSourceIdCache.set(databaseId, dataSourceId);
  return dataSourceId;
}

// 카테고리 DB 전체를 가져온다(글이 아니라 카테고리 자체 개수 기준이라 100개
// 넘을 일이 거의 없겠지만, 글 목록과 같은 이유로 커서까지 따라간다).
const getCategoryRows = cache(async (): Promise<CategoryRow[]> => {
  const dataSourceId = await getDataSourceId(CATEGORY_DATABASE_ID);
  const rows: CategoryRow[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    for (const page of res.results) {
      const props = (
        page as {
          properties: {
            이름?: { title?: { plain_text: string }[] };
            상위카테고리?: { relation?: { id: string }[] };
          };
        }
      ).properties;
      rows.push({
        id: (page as { id: string }).id,
        name: props["이름"]?.title?.[0]?.plain_text ?? "(이름 없음)",
        parentId: props["상위카테고리"]?.relation?.[0]?.id ?? null,
      });
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return rows;
});

const getCategoryMap = cache(async (): Promise<CategoryMap> => {
  const rows = await getCategoryRows();
  return new Map(rows.map((row) => [row.id, row]));
});

// Notion API는 한 번에 최대 100개까지만 주고 나머지는 has_more/next_cursor로
// 다음 페이지를 따로 요청해야 한다 — 글이 100개 넘으면 조용히 누락되는 걸 막기 위해
// has_more가 false가 될 때까지 커서를 따라가며 전부 모은다.
// 여러 컴포넌트(PostList, CategoryList 등)가 같은 요청 안에서 각자 호출하므로
// cache()로 감싸 중복 조회를 막는다.
const getPublishedPages = cache(async (): Promise<NotionPage[]> => {
  const dataSourceId = await getDataSourceId(DATABASE_ID);
  const results: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [{ property: "날짜", direction: "descending" }],
      start_cursor: cursor,
    });
    results.push(...(res.results as NotionPage[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return results.filter((page) => page.public_url != null);
});

export const getPublishedPosts = cache(async (): Promise<Post[]> => {
  const [pages, categoryMap] = await Promise.all([
    getPublishedPages(),
    getCategoryMap(),
  ]);
  return pages.map((page) => toPost(page, categoryMap));
});

// 사이드바에서도 조회하는 공개 글 목록을 재사용한다. 관계에 포함돼 있어도
// 비공개·삭제·다른 DB의 페이지는 블로그 링크로 노출하지 않는다.
export const getRelatedPosts = cache(async (postId: string): Promise<Post[]> => {
  const normalizeId = (id: string) => id.replaceAll("-", "").toLowerCase();
  const pages = await getPublishedPages();
  const page = pages.find((item) => normalizeId(item.id) === normalizeId(postId));
  const relation = page?.properties["관련 포스트"];
  if (!relation) return [];

  let relatedIds = relation.relation.map((item) => item.id);

  // 페이지 응답에 담긴 관계가 잘린 경우 속성 API의 커서를 따라 전부 읽는다.
  if (relation.has_more) {
    relatedIds = [];
    let cursor: string | undefined;
    do {
      const response = await notion.pages.properties.retrieve({
        page_id: postId,
        property_id: relation.id,
        start_cursor: cursor,
      });
      if (response.object !== "list") break;
      for (const item of response.results) {
        if (item.type === "relation") relatedIds.push(item.relation.id);
      }
      cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
    } while (cursor);
  }

  const posts = await getPublishedPosts();
  const postsById = new Map(posts.map((post) => [normalizeId(post.id), post]));
  const seen = new Set([normalizeId(postId)]);
  const relatedPosts: Post[] = [];
  for (const id of relatedIds) {
    const key = normalizeId(id);
    const post = postsById.get(key);
    if (post && !seen.has(key)) {
      seen.add(key);
      relatedPosts.push(post);
    }
  }
  return relatedPosts;
});

export const POSTS_PAGE_SIZE = 10;

// 홈 목록 페이지네이션용. 글이 많아져도 페이지 번호를 누르면 바로 이동 가능해야
// 해서(순서대로만 넘어가는 커서 체이닝 대신), 매번 처음부터 "그 페이지까지 필요한
// 만큼"(page * pageSize)만 요청한다 — 정렬 기준이 항상 같으므로 결과는 매번
// 일관되고, 전체 글을 다 가져오지 않아도 된다.
// "다음 페이지 존재 여부"를 추가 요청 없이 바로 판단하려고 필요한 것보다 1개 더
// 가져온다. 공개 여부(public_url) 필터링은 응답을 받은 뒤에만 할 수 있어서, 그
// 사이에 비공개 글이 섞여 있으면 실제 개수가 페이지당 정확히 pageSize보다 적게
// 나올 수 있음(드물고, 다음 페이지에서 자연히 이어짐) — 감안하고 단순하게 감.
export async function getPublishedPostsPage(
  page: number,
  pageSize = POSTS_PAGE_SIZE,
): Promise<{ posts: Post[]; hasNextPage: boolean }> {
  const [dataSourceId, categoryMap] = await Promise.all([
    getDataSourceId(DATABASE_ID),
    getCategoryMap(),
  ]);
  const targetCount = page * pageSize + 1;
  const results: NotionPage[] = [];
  let cursor: string | undefined;

  while (results.length < targetCount) {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [{ property: "날짜", direction: "descending" }],
      start_cursor: cursor,
      page_size: Math.min(100, targetCount - results.length),
    });
    results.push(...(res.results as NotionPage[]));
    if (!res.has_more) break;
    cursor = res.next_cursor ?? undefined;
  }

  const filtered = results
    .filter((p) => p.public_url != null)
    .map((page) => toPost(page, categoryMap));
  const start = (page - 1) * pageSize;

  return {
    posts: filtered.slice(start, start + pageSize),
    hasNextPage: filtered.length > page * pageSize,
  };
}

// category는 categoryPath(루트~리프) 어디에 있는 이름이든 매칭한다 — 사이드바
// 카테고리 트리가 상위/하위 어느 레벨을 클릭해도 같은 라우트로 링크하기 때문.
// 카테고리는 Relation이라 Notion 쿼리 필터로 직접 거르기 까다로워서(예전 Select
// 필터에서 겪은 400 에러와 비슷한 이유), 전체 글을 가져와 코드에서 매칭한다.
export async function getPostsByCategory(category: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.categoryPath.includes(category));
}

// generateMetadata와 페이지 컴포넌트가 같은 요청 안에서 둘 다 호출하므로,
// cache()로 감싸 같은 slug에 대해 노션 API가 중복으로 나가지 않게 한다.
export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const [dataSourceId, categoryMap] = await Promise.all([
    getDataSourceId(DATABASE_ID),
    getCategoryMap(),
  ]);
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { property: "슬러그", rich_text: { equals: slug } },
  });
  const page = res.results[0] as NotionPage | undefined;
  if (page) return page.public_url != null ? toPost(page, categoryMap) : null;

  // "슬러그" 속성이 비어있는 글은 목록에서 노션 페이지 id를 그대로 URL로
  // 쓰게 되는데, 그 경우를 위해 페이지 id로도 조회를 시도한다.
  try {
    const fallbackPage = (await notion.pages.retrieve({
      page_id: slug,
    })) as NotionPage;
    if (fallbackPage.public_url == null) return null;
    const post = toPost(fallbackPage, categoryMap);
    return post.slug === slug || fallbackPage.id === slug ? post : null;
  } catch {
    return null;
  }
});

export type CategoryTreeNode = {
  name: string;
  // 이 카테고리 "이하"(자기 자신 + 모든 하위 카테고리)에 속한 공개 글 수.
  // getPostsByCategory가 categoryPath 어느 레벨이든 매칭하는 것과 같은 기준.
  postCount: number;
  children: CategoryTreeNode[];
};

// 카테고리 DB의 "상위카테고리"(부모 이름) 구조를 그대로 트리로 만든다. 글이
// 있는지와 무관하게 DB에 정의된 카테고리 전체를 보여준다 — 카테고리 DB 자체가
// 분류 체계의 기준. 옆에 표시할 글 개수만 실제 공개 글 기준으로 센다.
export const getCategories = cache(async (): Promise<CategoryTreeNode[]> => {
  const [rows, posts] = await Promise.all([
    getCategoryRows(),
    getPublishedPosts(),
  ]);
  const childrenByParentId = new Map<string | null, CategoryRow[]>();

  for (const row of rows) {
    const siblings = childrenByParentId.get(row.parentId) ?? [];
    siblings.push(row);
    childrenByParentId.set(row.parentId, siblings);
  }

  const postCountByName = new Map<string, number>();
  for (const post of posts) {
    for (const name of new Set(post.categoryPath)) {
      postCountByName.set(name, (postCountByName.get(name) ?? 0) + 1);
    }
  }

  // "하위 항목" 기능을 쓰면 정상적으로는 순환이 생길 수 없지만, 혹시 모를 실수
  // 대비로 이미 지나온 id는 다시 자식으로 펼치지 않는다.
  function build(parentId: string | null, ancestors: Set<string>): CategoryTreeNode[] {
    return (childrenByParentId.get(parentId) ?? [])
      .filter((row) => !ancestors.has(row.id))
      .map((row) => ({
        name: row.name,
        postCount: postCountByName.get(row.name) ?? 0,
        children: build(row.id, new Set(ancestors).add(row.id)),
      }))
      .filter((node) => node.postCount > 0);
  }

  return build(null, new Set());
});

// 포스트 상세 페이지의 본문(children 슬롯)과 목차(@rightPanel 슬롯)가 같은
// 요청 안에서 각자 이 함수를 부르므로, cache()로 감싸 recordMap을 중복으로
// 받아오지 않게 한다.
export const getPageRecordMap = cache(
  async (pageId: string): Promise<ExtendedRecordMap> => {
    return notionApi.getPage(pageId);
  },
);
