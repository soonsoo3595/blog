import { mockStats } from "@/lib/mock";

export default function RightPanel() {
  return (
    <aside className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-panel p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
          방문자 통계
        </p>
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/60">오늘</dt>
            <dd>{mockStats.todayVisitors}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">전체</dt>
            <dd>{mockStats.totalVisitors}</dd>
          </div>
        </dl>
      </div>

      <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-foreground/40">
        추후 추가
      </div>
    </aside>
  );
}
