import "server-only";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5145";

export async function getPostViewCount(postId: string): Promise<number> {
  const res = await fetch(`${BACKEND_API_URL}/api/posts/${postId}/views`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return 0;
  }

  const data = (await res.json()) as { count: number };
  return data.count;
}

export async function incrementPostViewCount(postId: string): Promise<number> {
  const res = await fetch(`${BACKEND_API_URL}/api/posts/${postId}/views`, {
    method: "POST",
    cache: "no-store",
  });

  if (!res.ok) {
    return getPostViewCount(postId);
  }

  const data = (await res.json()) as { count: number };
  return data.count;
}
