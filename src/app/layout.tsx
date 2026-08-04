import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "블로그",
  description: "개발과 일상을 기록하는 개인 블로그",
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <Header />
        <div className="mx-auto grid max-w-[var(--layout-max-width)] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[var(--sidebar-width)_1fr_var(--right-panel-width)] lg:gap-[var(--layout-gap)]">
          <Sidebar />
          <main>{children}</main>
          <RightPanel />
        </div>
      </body>
    </html>
  );
}
