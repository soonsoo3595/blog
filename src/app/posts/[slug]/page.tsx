import { notFound } from "next/navigation";
import { getBlockValue, getPageTableOfContents } from "notion-utils";
import type { PageBlock } from "notion-types";
import { getPostBySlug, getPageRecordMap } from "@/lib/notion";
import NotionPage from "@/components/NotionPage";
import TableOfContents from "@/components/TableOfContents";

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
  const toc = getPageTableOfContents(
    getBlockValue(recordMap.block[post.id]) as PageBlock,
    recordMap,
  );

  return (
    <div className="flex items-start gap-8">
      <article className="flex min-w-0 flex-1 flex-col gap-8">
        <div>
          <h1 className="text-4xl font-semibold">{post.title}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {post.date.split("T")[0]}
          </p>
        </div>
        <NotionPage recordMap={recordMap} />
      </article>
      <TableOfContents items={toc} />
    </div>
  );
}
