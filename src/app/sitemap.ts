import type { MetadataRoute } from "next";
import { getCategories, getPublishedPosts, type CategoryTreeNode } from "@/lib/notion";

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
