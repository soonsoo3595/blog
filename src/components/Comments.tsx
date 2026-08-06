"use client";

import { useEffect, useState } from "react";
import Giscus from "@giscus/react";

export default function Comments() {
  // giscus는 자체 iframe이라 서버에서 그릴 게 없고, 다크모드도 최초 클래스가
  // 확정되는 마운트 이후에만 알 수 있다(ThemeToggle과 같은 이유).
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    };
    sync();

    // ThemeToggle이 커스텀 이벤트 없이 그냥 documentElement의 class만 토글하므로,
    // 테마 전환을 실시간으로 따라가려면 class 변화를 직접 관찰해야 한다.
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Giscus
      repo={process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}`}
      repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
      category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY}
      categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme={theme}
      lang="ko"
    />
  );
}
