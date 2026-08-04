import Link from "next/link";
import { mockCategories } from "@/lib/mock";

export default function CategoryList() {
  return (
    <nav className="rounded-xl border border-border bg-panel p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        카테고리
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {mockCategories.map((category) => (
          <li key={category}>
            <Link
              href={`/categories/${category}`}
              className="block rounded-md px-2 py-1.5 hover:bg-background"
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
