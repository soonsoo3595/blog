"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SearchHit = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data: { hits: SearchHit[] }) => {
          setHits(data.hits);
          setOpen(true);
        })
        .catch(() => {});
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <form className="flex" onSubmit={(e) => e.preventDefault()}>
        <input
          type="search"
          placeholder="제목, 내용 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          className="w-full rounded-lg border border-border bg-panel px-4 py-2 text-sm outline-none focus:border-accent"
        />
      </form>

      {open && hits.length > 0 && (
        <ul className="absolute top-full z-10 mt-2 w-full min-w-72 rounded-lg border border-border bg-panel py-2 shadow-lg">
          {hits.map((hit) => (
            <li key={hit.id}>
              <Link
                href={`/posts/${hit.slug}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-border/50"
              >
                <p className="truncate">{hit.title}</p>
                <p className="truncate text-xs text-foreground/60">
                  {hit.category}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
