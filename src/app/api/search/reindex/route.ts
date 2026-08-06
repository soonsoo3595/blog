import { NextResponse } from "next/server";
import { reindexPosts } from "@/lib/search";

export async function POST(request: Request) {
  const secret = request.headers.get("x-reindex-secret");

  if (!process.env.REINDEX_SECRET || secret !== process.env.REINDEX_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const indexed = await reindexPosts();
  return NextResponse.json({ indexed });
}
