import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";

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
