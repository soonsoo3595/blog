import Link from "next/link";
import type { Post } from "@/lib/notion";

export function PostListView({ posts }: { posts: Post[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.slug}`}
            className="flex gap-5 rounded-xl border border-border bg-panel p-4 hover:border-accent"
          >
            {post.cover ? (
              // 커버 이미지는 노션 업로드(signed URL, 도메인 예측 불가)든 외부 링크(임의
              // 도메인)든 출처가 다양해서 next/image의 도메인 화이트리스트에 안 맞는다 —
              // 그냥 <img>로 둔다.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover}
                alt=""
                className="h-20 w-28 shrink-0 rounded-lg object-cover"
              />
            ) : (
              // 커버 유무와 상관없이 카드 레이아웃이 동일하도록, 없을 땐 같은 크기의
              // 빈 자리를 채워둔다.
              <div className="h-20 w-28 shrink-0 rounded-lg bg-background" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xs text-foreground/60">
                {post.categoryPath.join(" > ")}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{post.title}</h2>
              <p className="mt-auto self-end text-sm text-foreground/60">
                {post.date.split("T")[0]}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
