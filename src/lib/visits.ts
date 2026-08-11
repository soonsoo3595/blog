import "server-only";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5145";

export type VisitStats = {
  today: number;
  total: number;
};

export async function getVisitStats(): Promise<VisitStats> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/visits`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { today: 0, total: 0 };
    }

    return (await res.json()) as VisitStats;
  } catch {
    // 백엔드(backend/)가 안 떠 있어도 방문자 수 없이 페이지는 정상 렌더링되게 함
    return { today: 0, total: 0 };
  }
}

export async function logVisit(visitorId: string): Promise<VisitStats> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
      cache: "no-store",
    });

    if (!res.ok) {
      return { today: 0, total: 0 };
    }

    return (await res.json()) as VisitStats;
  } catch {
    return { today: 0, total: 0 };
  }
}
