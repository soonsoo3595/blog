import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-foreground/60">
        아직 만들어지지 않았거나 존재하지 않는 페이지예요.
      </p>
      <Link href="/" className="mt-2 text-sm underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
