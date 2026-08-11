"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { NotionRenderer } from "react-notion-x";
import type { ExtendedRecordMap } from "notion-types";

import "react-notion-x/src/styles.css";
// react-notion-x는 prismjs로 토큰화만 해주고 색상 테마 CSS는 안 갖고 있어서,
// 이걸 안 넣으면 코드 블록이 토큰화는 되어도 전부 같은 색(무채색)으로만 보인다.
import "prismjs/themes/prism.css";

// react-notion-x의 Code 컴포넌트는 기본적으로 clike/css/js/json/jsx/tsx/ts
// 문법만 번들에 포함하고 있어서, sql/c++ 등 다른 언어로 지정한 코드 블록은
// prismjs가 해당 문법을 몰라 하이라이팅 없이 그냥 텍스트로만 나온다. 여기서
// 추가 문법을 등록해준다 — c/cpp처럼 서로 의존하는 문법은 base가 먼저 로드된
// 뒤에 순서대로 로드해야 하므로(둘 다 동시에 부르면 로드 순서가 보장 안 됨)
// Promise.all이 아니라 순차 await로 불러온다.
const Code = dynamic(async () => {
  const { Code } = await import("react-notion-x/build/third-party/code");
  await import("prismjs/components/prism-c.min.js");
  await import("prismjs/components/prism-cpp.min.js");
  await import("prismjs/components/prism-csharp.min.js");
  await import("prismjs/components/prism-java.min.js");
  await import("prismjs/components/prism-go.min.js");
  await import("prismjs/components/prism-python.min.js");
  await import("prismjs/components/prism-sql.min.js");
  await import("prismjs/components/prism-bash.min.js");
  await import("prismjs/components/prism-yaml.min.js");
  return Code;
});
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
