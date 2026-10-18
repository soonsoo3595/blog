import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";

// DB·연결 설정이 달라지면 기존 캐시와 분리한다. 토큰 원문은 키에 저장하지 않는다.
const scope = createHash("sha256").update(JSON.stringify([
  process.env.NOTION_TOKEN,
  process.env.NOTION_DATABASE_ID,
  process.env.NOTION_CATEGORY_DATABASE_ID,
  process.env.NOTION_QUIZ_DATABASE_ID,
])).digest("hex");

export const NOTION_CACHE_TAG = `notion:${scope}`;

// Cache Components를 사용하지 않는 현재 구성의 Next.js Data Cache.
export function cacheNotion<Args extends unknown[], Result>(
  name: string,
  load: (...args: Args) => Promise<Result>,
  revalidate = 60,
) {
  return unstable_cache(load, ["notion-v1", scope, name], {
    revalidate,
    tags: [NOTION_CACHE_TAG],
  });
}
