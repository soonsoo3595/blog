import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPageRecordMap } from "@/lib/notion";
import { getPostViewCount } from "@/lib/views";
import NotionPage from "@/components/NotionPage";
import Comments from "@/components/Comments";
import ViewCounter from "@/components/ViewCounter";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const description = `${post.categoryPath.join(" > ")} 카테고리 · 개발과 일상을 기록하는 개인 블로그`;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.date,
      url: `/posts/${post.slug}`,
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const recordMap = await getPageRecordMap(post.id);
  const viewCount = await getPostViewCount(post.id);

  return (
    <article className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-semibold">{post.title}</h1>
        <p className="mt-1 flex gap-2 text-sm text-foreground/60">
          <span>{post.date.split("T")[0]}</span>
          <span>·</span>
          <ViewCounter postId={post.id} initialCount={viewCount} />
        </p>
      </div>
      <NotionPage recordMap={recordMap} />
      <Comments />
    </article>
  );
}
