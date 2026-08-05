// 백엔드(.NET + Postgres) 연결 전까지 화면 확인용 임시 데이터.
// 실제 데이터 연결 시 이 파일은 제거된다.

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export const mockCategories: Category[] = [
  { id: "dev", name: "개발", slug: "dev", parentId: null },
  { id: "dev-frontend", name: "프론트엔드", slug: "frontend", parentId: "dev" },
  { id: "dev-backend", name: "백엔드", slug: "backend", parentId: "dev" },
  { id: "life", name: "일상", slug: "life", parentId: null },
  { id: "retro", name: "회고", slug: "retro", parentId: null },
];

export const mockPosts = [
  {
    slug: "hello-world",
    title: "블로그를 시작하며",
    categoryId: "life",
    excerpt: "첫 글입니다. 앞으로 개발과 일상을 기록해나갈 예정입니다.",
    date: "2026-08-04",
  },
];

export const mockStats = {
  todayVisitors: 0,
  totalVisitors: 0,
};
