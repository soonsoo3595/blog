import { getPublishedPostsPage, POSTS_PAGE_SIZE } from "@/lib/notion";
import { PostListView } from "@/components/PostList";
import Pagination from "@/components/Pagination";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { posts, hasNextPage } = await getPublishedPostsPage(
    page,
    POSTS_PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-4">
      <PostListView posts={posts} />
      <Pagination currentPage={page} basePath="/" hasNextPage={hasNextPage} />
    </div>
  );
}
