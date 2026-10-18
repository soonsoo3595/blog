import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { NOTION_CACHE_TAG } from "@/lib/notion-cache";

export async function POST(request: Request) {
  if (!process.env.REINDEX_SECRET || request.headers.get("x-reindex-secret") !== process.env.REINDEX_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  revalidateTag(NOTION_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
