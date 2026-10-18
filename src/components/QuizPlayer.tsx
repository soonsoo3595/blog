"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ExtendedRecordMap } from "notion-types";
import NotionPage from "@/components/NotionPage";
import type { QuizCategory, QuizQuestion, QuizReference, QuizStats } from "@/lib/quiz-types";

type Answer = { recordMap: ExtendedRecordMap; references: QuizReference[] };
type QuizRound = { questions: QuizQuestion[] };

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data as T;
}

const buttonClass = "rounded-lg border border-border px-4 py-2 text-sm hover:border-accent disabled:cursor-not-allowed disabled:opacity-50";

export default function QuizPlayer({ categories, total }: { categories: QuizCategory[]; total: number }) {
  const [category, setCategory] = useState("");
  const [deck, setDeck] = useState<QuizQuestion[]>([]);
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [records, setRecords] = useState<Record<string, QuizStats>>({});
  const [graded, setGraded] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"question" | "answer" | null>(null);
  const [error, setError] = useState("");
  // 빠른 연속 클릭에서도 요청 하나만 전송한다.
  const requestInFlight = useRef(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const lastGradedId = useRef<string | null>(null);
  const count = category ? categories.find((item) => item.id === category)?.count ?? 0 : total;
  const current = deck[position] ? { question: deck[position] } : null;
  const completed = deck.length > 0 && position >= deck.length;
  const roundTotal = deck.length || count;
  const progress = deck.length ? Math.min(position + 1, deck.length) : 0;
  const stats = current ? records[current.question.id] ?? { correct: 0, attempts: 0 } : null;

  async function nextQuestion(restart = false) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy("question");
    setError("");
    try {
      if (restart || deck.length === 0) {
        const params = new URLSearchParams({ category });
        const next = await readResponse<QuizRound>(await fetch(`/api/quizzes/question?${params}`, { cache: "no-store" }));
        if (!next.questions.length) throw new Error("선택한 카테고리에 문제가 없습니다.");
        setDeck(next.questions);
        setPosition(0);
        lastGradedId.current = null;
      } else {
        setPosition((previous) => Math.min(previous + 1, deck.length));
      }
      setAnswer(null);
      setAnswerOpen(false);
      setGraded(null);
      requestAnimationFrame(() => questionHeading.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "문제를 불러오지 못했습니다.");
    } finally {
      requestInFlight.current = false;
      setBusy(null);
    }
  }

  async function revealAnswer() {
    if (!current || requestInFlight.current) return;
    if (answer) { setAnswerOpen(!answerOpen); return; }
    requestInFlight.current = true;
    setBusy("answer");
    setError("");
    try {
      const data = await readResponse<Answer>(await fetch(`/api/quizzes/${current.question.id}/answer`, { cache: "no-store" }));
      setAnswer(data);
      setAnswerOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "답을 불러오지 못했습니다.");
    } finally {
      requestInFlight.current = false;
      setBusy(null);
    }
  }

  async function grade(correct: boolean) {
    if (!current || !answer || graded !== null || requestInFlight.current || lastGradedId.current === current.question.id) return;
    lastGradedId.current = current.question.id;
    // 영구 저장 방식은 보류 중이므로 현재 화면의 학습 기록만 갱신한다.
    setGraded(correct);
    setRecords((previous) => {
      const record = previous[current.question.id] ?? { correct: 0, attempts: 0 };
      return { ...previous, [current.question.id]: { correct: record.correct + Number(correct), attempts: record.attempts + 1 } };
    });
    await nextQuestion();
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">퀴즈</h1>
        <p className="mt-2 text-sm text-foreground/60">각 카테고리별로 랜덤 퀴즈를 보고 정답을 생각해보고 채점해보세요 (생각하셨던 답과 다를 수 있습니다...) </p>
      </div>
      <div className="rounded-xl border border-border bg-panel p-5">
        <label htmlFor="quiz-category" className="mb-2 block text-sm font-medium">카테고리</label>
        <select
          id="quiz-category"
          value={category}
          disabled={busy !== null}
          onChange={(event) => {
            setCategory(event.target.value);
            setDeck([]); setPosition(0); lastGradedId.current = null;
            setAnswer(null); setAnswerOpen(false); setGraded(null); setError("");
          }}
          className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">전체 ({total})</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.count})</option>)}
        </select>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-foreground/60">진행 <span className="font-semibold text-foreground">{progress} / {roundTotal}</span></p>
          <button className={buttonClass} disabled={busy !== null || count === 0} onClick={() => nextQuestion(completed)}>
            {busy === "question" ? "문제 불러오는 중…" : completed ? "다시 시작" : current ? "다음 문제" : "퀴즈 시작"}
          </button>
        </div>
      </div>
      {count === 0 && <p className="text-sm text-foreground/60">아직 공개된 문제가 없습니다.</p>}
      {error && <p role="alert" className="rounded-lg border border-border p-4 text-sm">{error}</p>}
      {completed && <p role="status" className="rounded-xl border border-border bg-panel p-5 text-sm">선택한 카테고리의 문제를 모두 확인했습니다. ‘다시 시작’으로 한 번 더 풀어보세요.</p>}
      {current && (
        <section aria-labelledby="quiz-question" aria-busy={busy !== null} className="min-w-0 rounded-xl border border-border p-5 sm:p-6">
          <p className="text-xs text-foreground/60">{current.question.categoryNames.join(" · ")}</p>
          <h2 id="quiz-question" ref={questionHeading} tabIndex={-1} className="mt-3 break-words text-xl font-semibold outline-none">{current.question.title}</h2>
          <p className="mt-3 text-xs text-foreground/60" aria-live="polite">이 문제 · 맞춘 횟수 / 시도 횟수 {stats ? `${stats.correct} / ${stats.attempts}` : "— / —"}</p>
          <p className="mt-1 text-xs text-foreground/60">문제별 기록은 새로고침하면 초기화됩니다.</p>
          <button onClick={revealAnswer} disabled={busy !== null} aria-expanded={answerOpen} aria-controls="quiz-answer" className={`${buttonClass} mt-6`}>
            {busy === "answer" ? "답 불러오는 중…" : answerOpen ? "답 접기" : "답 보기"}
          </button>
          {answer && (
            <div id="quiz-answer" hidden={!answerOpen} className="mt-6 min-w-0 border-t border-border pt-5">
              <NotionPage recordMap={answer.recordMap} />
              {answer.references.length > 0 && <div className="mt-5">
                <h3 className="text-sm font-semibold">참고 문서</h3>
                <ul className="mt-2 flex flex-col gap-2 text-sm">{answer.references.map((post) => (
                  <li key={post.id}><Link href={`/posts/${post.slug}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">{post.title} ↗</Link></li>
                ))}</ul>
              </div>}
            </div>
          )}
          {answer && graded === null && <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => grade(true)} disabled={busy !== null} className={buttonClass}>맞았어요</button>
            <button onClick={() => grade(false)} disabled={busy !== null} className={buttonClass}>틀렸어요</button>
          </div>}
          {graded !== null && <p role="status" className="mt-5 text-sm">{graded ? "정답" : "오답"}으로 집계했습니다. {busy === "question" ? "다음 문제를 불러오는 중…" : "‘다음 문제’로 다시 시도해 주세요."}</p>}
        </section>
      )}
    </div>
  );
}
