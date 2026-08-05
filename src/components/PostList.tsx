import Link from "next/link";
import { mockPosts, mockCategories } from "@/lib/mock";

export default function PostList() {
  return (
    <ul className="flex flex-col gap-3">
      {mockPosts.map((post) => {
        const category = mockCategories.find((c) => c.id === post.categoryId);

        return (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="block rounded-xl border border-border bg-panel p-4 hover:border-accent"
            >
              <p className="text-xs text-foreground/60">
                {category?.name} · {post.date}
              </p>
              <h2 className="mt-1 font-semibold">{post.title}</h2>
              <p className="mt-1 text-sm text-foreground/70">{post.excerpt}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
