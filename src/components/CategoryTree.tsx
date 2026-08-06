"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CategoryTreeNode } from "@/lib/notion";

const STORAGE_KEY = "categoryTree:collapsed";

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function CategoryItem({
  node,
  path,
  collapsed,
  onToggle,
}: {
  node: CategoryTreeNode;
  path: string;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(path);

  return (
    <li>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(path)}
            aria-label={isCollapsed ? "펼치기" : "접기"}
            className="flex h-5 w-5 shrink-0 items-center justify-center text-foreground/50 hover:text-foreground"
          >
            <span
              className={`inline-block text-[10px] transition-transform ${
                isCollapsed ? "" : "rotate-90"
              }`}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Link
          href={`/categories/${encodeURIComponent(node.name)}`}
          className="flex flex-1 items-center justify-between gap-2 rounded-md px-2 py-1 font-medium hover:bg-background"
        >
          <span className="truncate">{node.name}</span>
          <span className="shrink-0 text-xs font-normal text-foreground/40">
            ({node.postCount})
          </span>
        </Link>
      </div>
      {hasChildren && !isCollapsed && (
        <ul className="ml-2 flex flex-col gap-1 pl-4">
          {node.children.map((child) => (
            <CategoryItem
              key={child.name}
              node={child}
              path={`${path}/${child.name}`}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryTree({
  categories,
}: {
  categories: CategoryTreeNode[];
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // 서버 렌더링 시점엔 localStorage가 없어 항상 "전체 펼침"으로 그려진다.
    // 하이드레이션 불일치를 피하려고 저장된 접힘 상태는 마운트 후에 반영한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(loadCollapsed());
  }, []);

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {categories.map((node) => (
        <CategoryItem
          key={node.name}
          node={node}
          path={node.name}
          collapsed={collapsed}
          onToggle={toggle}
        />
      ))}
    </ul>
  );
}
