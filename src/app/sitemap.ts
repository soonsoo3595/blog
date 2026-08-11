import type { MetadataRoute } from "next";
import { getCategories, getPublishedPosts, type CategoryTreeNode } from "@/lib/notion";

// 빌드 시점에 정적으로 미리 만들면 노션 API 호출이 빌드에 필요해지고(런타임 시크릿을
// 빌드에 넣어야 함) 내용도 다음 배포 전까지 갱신이 안 된다. 요청마다 새로 만들게 함.
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function flattenCategoryNames(
  nodes: CategoryTreeNode[],
  names = new Set<string>(),
): Set<string> {
  for (const node of nodes) {
    names.add(node.name);
    flattenCategoryNames(node.children, names);
  }
  return names;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
  ]);

  const categoryNames = flattenCategoryNames(categories);

  return [
    { url: siteUrl },
    ...posts.map((post) => ({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: post.date || undefined,
    })),
    ...Array.from(categoryNames).map((name) => ({
      url: `${siteUrl}/categories/${encodeURIComponent(name)}`,
    })),
  ];
}
