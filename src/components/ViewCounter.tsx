"use client";

import { useEffect, useState } from "react";

export default function ViewCounter({
  postId,
}: {
  postId: string;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/views/${postId}`, { method: "POST" })
      .then((res) => res.json())
      .then((data: { count: number }) => setCount(data.count))
      .catch(() => {});
  }, [postId]);

  return <span>조회 {count ?? "—"}</span>;
}
