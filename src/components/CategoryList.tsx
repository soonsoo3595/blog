import Link from "next/link";
import { getCategories } from "@/lib/notion";

export default async function CategoryList() {
  const categories = await getCategories();

  return (
    <nav className="rounded-xl border border-border bg-panel p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        카테고리
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {categories.map((group) =>
          group.subCategories.length === 0 ? (
            <li key={group.name}>
              <Link
                href={`/categories/${encodeURIComponent(group.name)}`}
                className="block rounded-md px-2 py-1.5 font-medium hover:bg-background"
              >
                {group.name}
              </Link>
            </li>
          ) : (
            <li key={group.name}>
              <Link
                href={`/categories/${encodeURIComponent(group.name)}`}
                className="block rounded-md px-2 py-1 font-medium hover:bg-background"
              >
                {group.name}
              </Link>
              <ul className="ml-2 flex flex-col gap-1 border-l border-border pl-2">
                {group.subCategories.map((sub) => (
                  <li key={sub}>
                    <Link
                      href={`/categories/${encodeURIComponent(sub)}`}
                      className="block rounded-md px-2 py-1 text-foreground/80 hover:bg-background"
                    >
                      {sub}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
