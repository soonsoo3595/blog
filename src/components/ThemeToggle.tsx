"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // 마운트되기 전까지는 아이콘을 그리지 않는다(서버와 클라이언트가 똑같이 "아무것도
  // 없음"을 렌더링하므로 하이드레이션 불일치 자체가 발생하지 않는다). 마운트된 직후에만
  // 실제 DOM 상태를 읽어 아이콘을 확정한다.
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="테마 전환"
      className="w-8 rounded-full p-2 text-sm transition-colors hover:bg-panel"
    >
      {mounted ? (isDark ? "🌙" : "☀️") : null}
    </button>
  );
}
