import Link from "next/link";
import { getPublishedPosts, type Post } from "@/lib/notion";

export function PostListView({ posts }: { posts: Post[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.slug}`}
            className="block rounded-xl border border-border bg-panel p-4 hover:border-accent"
          >
            <p className="text-xs text-foreground/60">
              {post.category} · {post.date}
            </p>
            <h2 className="mt-1 font-semibold">{post.title}</h2>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function PostList() {
  const posts = await getPublishedPosts();
  return <PostListView posts={posts} />;
}
