import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Header />
        <div className="mx-auto grid max-w-[var(--layout-max-width)] grid-cols-1 items-start gap-6 px-6 py-6 lg:grid-cols-[var(--sidebar-width)_1fr_var(--right-panel-width)] lg:gap-[var(--layout-gap)]">
          <Sidebar />
          <main>{children}</main>
          {rightPanel}
        </div>
      </body>
    </html>
  );
}
