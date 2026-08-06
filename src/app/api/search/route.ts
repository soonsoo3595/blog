import { NextResponse } from "next/server";
import { searchPosts } from "@/lib/search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const hits = await searchPosts(query);
  return NextResponse.json({ hits });
}
