import { NextResponse } from "next/server";
import { reindexPosts } from "@/lib/search";
import { revalidateTag } from "next/cache";
import { NOTION_CACHE_TAG } from "@/lib/notion-cache";

export async function POST(request: Request) {
  const secret = request.headers.get("x-reindex-secret");

  if (!process.env.REINDEX_SECRET || secret !== process.env.REINDEX_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 명시적으로 재인덱싱할 때는 직전 수정 내용까지 새로 읽는다.
  revalidateTag(NOTION_CACHE_TAG, { expire: 0 });
  const indexed = await reindexPosts();
  return NextResponse.json({ indexed });
}
