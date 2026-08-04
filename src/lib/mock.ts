// 백엔드(.NET + Postgres) 연결 전까지 화면 확인용 임시 데이터.
// 실제 데이터 연결 시 이 파일은 제거된다.

export const mockCategories = ["개발", "일상", "회고"];

export const mockPosts = [
  {
    slug: "hello-world",
    title: "블로그를 시작하며",
    category: "일상",
    excerpt: "첫 글입니다. 앞으로 개발과 일상을 기록해나갈 예정입니다.",
    date: "2026-08-04",
  },
];

export const mockStats = {
  todayVisitors: 0,
  totalVisitors: 0,
};
