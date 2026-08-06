import { getBlockValue, getPageTableOfContents } from "notion-utils";
import type { PageBlock } from "notion-types";
import { getPostBySlug, getPageRecordMap } from "@/lib/notion";
import TableOfContents from "@/components/TableOfContents";
import RightPanel from "@/components/RightPanel";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// 포스트 상세 페이지 전용 오른쪽 패널: 목차 + 기존 방문자 통계를 같이 보여준다.
// 본문(children 슬롯)에서 slug로 존재하지 않는 글이면 notFound()를 던져 페이지
// 전체가 404로 대체되므로, 여기서는 그냥 아무것도 렌더링하지 않으면 된다.
export default async function PostRightPanel({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return null;
  }

  const recordMap = await getPageRecordMap(post.id);
  const toc = getPageTableOfContents(
    getBlockValue(recordMap.block[post.id]) as PageBlock,
    recordMap,
  );

  return (
    <div className="sticky top-6 flex flex-col gap-5">
      <TableOfContents items={toc} />
      <RightPanel />
    </div>
  );
}
