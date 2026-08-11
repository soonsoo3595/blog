import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* 로고 원본이 라이트 그린 선으로 그려져 있어서 흰 배경(라이트 모드)에선
              대비가 안 나온다. 진한 초록으로 다시 칠한 버전을 라이트 모드 전용으로 두고
              CSS로만 전환한다(JS 상태 없이 .dark 클래스만으로 즉시 전환, 깜빡임 없음). */}
          <Image
            src="/logo-light.png"
            alt="뎁밥 로고"
            width={48}
            height={48}
            className="dark:hidden"
          />
          <Image
            src="/logo.png"
            alt="뎁밥 로고"
            width={48}
            height={48}
            className="hidden dark:block"
          />
          <span className="text-base font-semibold tracking-tight">
            뎁밥
          </span>
        </Link>

        <div className="flex items-center gap-3 text-foreground/80">
          <div className="w-56">
            <SearchBar />
          </div>

          <ThemeToggle />

          <Link
            href="/portfolio"
            className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-panel"
          >
            포트폴리오
          </Link>
        </div>
      </div>
    </header>
  );
}
