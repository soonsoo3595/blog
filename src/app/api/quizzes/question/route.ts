import { NextResponse } from "next/server";
import { createQuizDeck, getQuizCatalog } from "@/lib/quiz";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const { questions } = await getQuizCatalog();
    const deck = createQuizDeck(questions, params.get("category") ?? "");
    if (!deck.length) return NextResponse.json({ error: "선택한 카테고리에 문제가 없습니다." }, { status: 404 });
    // 답 본문은 포함하지 않는다. 회차 시작 시 후보만 받아 다음 문제는 즉시 전환한다.
    return NextResponse.json({ questions: deck }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "문제를 불러오지 못했습니다." }, { status: 503 });
  }
}
