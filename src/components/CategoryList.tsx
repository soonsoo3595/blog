import Link from "next/link";
import { getCategories } from "@/lib/notion";

export default async function CategoryList() {
  const categories = await getCategories();

  return (
    <nav className="rounded-xl border border-border bg-panel p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        카테고리
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {categories.map((category) => (
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
