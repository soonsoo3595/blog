import "server-only";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5145";

export async function getPostViewCount(postId: string): Promise<number> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/posts/${postId}/views`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return 0;
    }

    const data = (await res.json()) as { count: number };
    return data.count;
  } catch {
    // 백엔드(backend/)가 안 떠 있어도 조회수 없이 포스트는 정상 렌더링되게 함
    return 0;
  }
}

export async function incrementPostViewCount(postId: string): Promise<number> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/posts/${postId}/views`, {
      method: "POST",
      cache: "no-store",
    });

    if (!res.ok) {
      return 0;
    }

    const data = (await res.json()) as { count: number };
    return data.count;
  } catch {
    return 0;
  }
}
