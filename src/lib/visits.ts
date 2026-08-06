import "server-only";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5145";

export type VisitStats = {
  today: number;
  total: number;
};

export async function getVisitStats(): Promise<VisitStats> {
  const res = await fetch(`${BACKEND_API_URL}/api/visits`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { today: 0, total: 0 };
  }

  return (await res.json()) as VisitStats;
}

export async function logVisit(visitorId: string): Promise<VisitStats> {
  const res = await fetch(`${BACKEND_API_URL}/api/visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId }),
    cache: "no-store",
  });

  if (!res.ok) {
    return getVisitStats();
  }

  return (await res.json()) as VisitStats;
}
