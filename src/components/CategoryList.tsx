import CategoryTree from "@/components/CategoryTree";
import { getCategories } from "@/lib/notion";

export default async function CategoryList() {
  const categories = await getCategories();

  return (
    <nav className="rounded-xl border border-border bg-panel p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        카테고리
      </p>
      <CategoryTree categories={categories} />
    </nav>
  );
}
