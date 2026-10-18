import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LoadingPanel from "@/components/LoadingPanel";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "뎁밥",
    template: "%s | 뎁밥",
  },
  description: "뎁밥 — 개발과 일상을 기록하는 개인 블로그",
};

const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
  rightPanel,
}: Readonly<{
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Header />
        <div className="mx-auto grid max-w-[var(--layout-max-width)] grid-cols-1 items-start gap-6 px-6 py-6 lg:grid-cols-[var(--sidebar-width)_1fr_var(--right-panel-width)] lg:gap-[var(--layout-gap)]">
          <Suspense fallback={<LoadingPanel label="카테고리를 불러오는 중…" />}>
            <Sidebar />
          </Suspense>
          <main>{children}</main>
          <Suspense fallback={<LoadingPanel label="오른쪽 패널을 불러오는 중…" />}>
            {rightPanel}
          </Suspense>
        </div>
      </body>
    </html>
  );
}
