import { notFound } from "next/navigation";
import { getPostsByCategory } from "@/lib/notion";
import { PostListView } from "@/components/PostList";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  // Next.js가 동적 세그먼트를 자동으로 디코딩해주지 않아서, URL 인코딩된 값
  // ("C%2B%2B" 등)이 그대로 넘어온다 — 직접 디코딩해야 노션 select 값과 매칭됨.
  const category = decodeURIComponent(rawCategory);
  const posts = await getPostsByCategory(category);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{category}</h1>
      <PostListView posts={posts} />
    </div>
  );
}
