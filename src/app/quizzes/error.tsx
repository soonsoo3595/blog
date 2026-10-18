"use client";

export default function QuizError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-border bg-panel p-6">
      <p>퀴즈를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button onClick={retry} className="mt-4 rounded-lg border border-border px-4 py-2">다시 시도</button>
    </div>
  );
}
