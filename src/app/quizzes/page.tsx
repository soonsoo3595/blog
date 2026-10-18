import type { Metadata } from "next";
import QuizPlayer from "@/components/QuizPlayer";
import { getQuizCatalog } from "@/lib/quiz";

export const metadata: Metadata = {
  title: "퀴즈",
  description: "카테고리별 문제를 풀고 답을 확인하며 학습 기록을 남겨보세요.",
};

export default async function QuizzesPage() {
  if (!process.env.NOTION_QUIZ_DATABASE_ID) {
    return <p className="rounded-xl border border-border bg-panel p-6">퀴즈를 준비하고 있습니다.</p>;
  }
  const { questions, categories } = await getQuizCatalog();
  return <QuizPlayer categories={categories} total={questions.length} />;
}
