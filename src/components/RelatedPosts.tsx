import Link from "next/link";
import type { Post } from "@/lib/notion";

export default function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-posts-heading" className="border-t border-border pt-6">
      <h2 id="related-posts-heading" className="mb-4 text-lg font-semibold">
        관련 포스트
      </h2>
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.slug}`}
              className="block min-w-0 rounded-xl border border-border bg-panel p-4 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <p className="break-words font-medium">{post.title}</p>
              <p className="mt-1 break-words text-xs text-foreground/60">
                {post.categoryPath.join(" > ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
