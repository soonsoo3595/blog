export default function LoadingPanel({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div role="status" className="rounded-xl border border-border bg-panel p-5">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
        <div className="h-4 w-2/3 rounded bg-border" />
        <div className="h-3 w-full rounded bg-border" />
        <div className="h-3 w-4/5 rounded bg-border" />
      </div>
    </div>
  );
}
