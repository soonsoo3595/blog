import { notFound } from "next/navigation";
import { getPostBySlug, getPageRecordMap } from "@/lib/notion";
import NotionPage from "@/components/NotionPage";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const recordMap = await getPageRecordMap(post.id);

  return (
    <article className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-foreground/60">
          {post.category} · {post.date}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{post.title}</h1>
      </div>
      <NotionPage recordMap={recordMap} />
    </article>
  );
}
