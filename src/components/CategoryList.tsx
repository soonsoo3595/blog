"use client";

import Link from "next/link";
import { useState } from "react";
import { mockCategories, type Category } from "@/lib/mock";

function CategoryNode({ category }: { category: Category }) {
  const children = mockCategories.filter((c) => c.parentId === category.id);
  const [expanded, setExpanded] = useState(false);
  const hasChildren = children.length > 0;

  return (
    <li>
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "하위 카테고리 접기" : "하위 카테고리 펼치기"}
            className="flex h-5 w-5 shrink-0 items-center justify-center text-foreground/50 hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Link
          href={`/categories/${category.slug}`}
          className="block flex-1 rounded-md px-2 py-1.5 hover:bg-background"
        >
          {category.name}
        </Link>
      </div>
      {expanded && hasChildren && (
        <ul className="flex flex-col gap-1 border-l border-border pl-3">
          {children.map((child) => (
            <CategoryNode key={child.id} category={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryList() {
  const rootCategories = mockCategories.filter((c) => c.parentId === null);

  return (
    <nav className="rounded-xl border border-border bg-panel p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        카테고리
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {rootCategories.map((category) => (
          <CategoryNode key={category.id} category={category} />
        ))}
      </ul>
    </nav>
  );
}
