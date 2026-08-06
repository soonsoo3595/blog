"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { NotionRenderer } from "react-notion-x";
import type { ExtendedRecordMap } from "notion-types";

import "react-notion-x/src/styles.css";

const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then((m) => m.Code),
);
const Collection = dynamic(
  () =>
    import("react-notion-x/build/third-party/collection").then(
      (m) => m.Collection,
    ),
  { ssr: false },
);
const Equation = dynamic(() =>
  import("react-notion-x/build/third-party/equation").then((m) => m.Equation),
);
const Modal = dynamic(
  () => import("react-notion-x/build/third-party/modal").then((m) => m.Modal),
  { ssr: false },
);

export default function NotionPage({
  recordMap,
}: {
  recordMap: ExtendedRecordMap;
}) {
  // darkMode={false}로 고정돼 있으면 react-notion-x의 다크모드 전용 스타일
  // (.dark-mode .notion-callout 등)이 항상 빠져서 다크모드에서 본문이 잘
  // 안 보이는 문제가 있었다. 우리 테마 토글(html.dark 클래스)을 그대로 읽어서
  // 반영하고, ThemeToggle이 언제든 클래스를 직접 토글할 수 있으므로
  // MutationObserver로 변경을 감지한다.
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDarkMode(root.classList.contains("dark"));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage={false}
      darkMode={darkMode}
      components={{ Code, Collection, Equation, Modal }}
    />
  );
}
