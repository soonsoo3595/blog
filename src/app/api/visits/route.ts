import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logVisit } from "@/lib/visits";

const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1년, 재방문자 식별용

export async function POST() {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get("visitor_id")?.value;

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    cookieStore.set("visitor_id", visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  const stats = await logVisit(visitorId);
  return NextResponse.json(stats);
}
