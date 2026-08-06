import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPostViewCount, incrementPostViewCount } from "@/lib/views";

const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 하루에 1번만 카운트

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const cookieName = `viewed_${postId}`;
  const cookieStore = await cookies();

  if (cookieStore.has(cookieName)) {
    const count = await getPostViewCount(postId);
    return NextResponse.json({ count });
  }

  const count = await incrementPostViewCount(postId);
  cookieStore.set(cookieName, "1", {
    maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
  });

  return NextResponse.json({ count });
}
