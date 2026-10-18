import { NextResponse } from "next/server";
import { getQuizAnswer } from "@/lib/quiz";

export async function GET(_request: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  if (!/^[0-9a-f-]{32,36}$/i.test(quizId)) {
    return NextResponse.json({ error: "잘못된 문제입니다." }, { status: 400 });
  }
  try {
    const answer = await getQuizAnswer(quizId);
    if (!answer) return NextResponse.json({ error: "공개된 문제를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(answer, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "답을 불러오지 못했습니다. 다시 시도해 주세요." }, { status: 503 });
  }
}
