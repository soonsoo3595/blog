import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostsByCategory, POSTS_PAGE_SIZE } from "@/lib/notion";
import { PostListView } from "@/components/PostList";
import Pagination from "@/components/Pagination";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  return {
    title: `${category} 카테고리`,
    description: `${category} 카테고리 글 목록`,
    alternates: { canonical: `/categories/${encodeURIComponent(category)}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { category: rawCategory } = await params;
  // Next.js가 동적 세그먼트를 자동으로 디코딩해주지 않아서, URL 인코딩된 값
  // ("C%2B%2B" 등)이 그대로 넘어온다 — 직접 디코딩해야 노션 select 값과 매칭됨.
  const category = decodeURIComponent(rawCategory);
  const posts = await getPostsByCategory(category);

  if (posts.length === 0) {
    notFound();
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PAGE_SIZE));
  const start = (page - 1) * POSTS_PAGE_SIZE;
  const pagePosts = posts.slice(start, start + POSTS_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{category}</h1>
      <PostListView posts={pagePosts} />
      <Pagination
        currentPage={page}
        basePath={`/categories/${encodeURIComponent(category)}`}
        totalPages={totalPages}
      />
    </div>
  );
}
