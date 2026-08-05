import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";
import AdminControls from "./AdminControls";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="블로그 로고" width={32} height={32} />
          <span className="text-base font-semibold tracking-tight">
            블로그 이름
          </span>
        </Link>

        <div className="flex items-center gap-3 text-foreground/80">
          <div className="w-56">
            <SearchBar />
          </div>

          <button aria-label="알림" className="rounded-full p-2 hover:bg-panel">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <ThemeToggle />

          <AdminControls />

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
