# blog

개발과 일상을 기록하는 개인 블로그 **뎁밥**. 작성·수정은 본인만 Notion에서 수행하고, 방문자는 글 조회·검색·댓글·리액션을 이용한다.

@AGENTS.md

## 문서 기준

2026-10-18 저장소 코드 기준. 실행 환경과 운영 서버 연결은 이번 정리에서 검증하지 않았다. 과거 기록상 2026-08-19에 [devbap.co.kr](https://devbap.co.kr)로 배포했으며 현재 운영 상태는 별도 확인이 필요하다.

개발 시작은 [README.md](README.md), 파일별 주의사항은 [docs/STRUCTURE.md](docs/STRUCTURE.md), 남은 작업과 제약은 [docs/ISSUES.md](docs/ISSUES.md)를 확인한다.

## 기술 스택과 서비스

| 영역 | 현재 구현 |
|---|---|
| 프론트엔드 | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| 콘텐츠 | Notion 글 DB + 카테고리 DB. 블로그는 읽기 전용 뷰어 |
| Notion 연결 | @notionhq/client로 속성·목록 조회, notion-client로 본문 조회, react-notion-x로 렌더링 |
| 검색 | Next.js API → Meilisearch. 공개 글 제목·본문·카테고리 인덱싱 |
| 댓글·리액션 | giscus → GitHub Discussions. 글 경로별 스레드 |
| 프로필 | GitHub 공개 사용자 API. 하루 캐시 |
| 조회수·방문자 | Next.js API → .NET 9 Web API → PostgreSQL (EF Core + Npgsql) |

Redis는 초기 계획이며 현재 연동 코드는 없다. 분석 서비스 Umami·Plausible도 미도입이다.

## 콘텐츠와 코드의 분리

이 저장소는 public이므로 실제 게시글과 비밀값을 커밋하지 않는다. 게시글은 Notion에, 조회수·방문자 기록은 PostgreSQL에 저장한다. src/content/about.md는 저장소에서 관리하는 사이드바 소개글이다.

블로그 관리자 인증·자체 에디터는 Notion 도입으로 제거했다. 기존 mock 인증을 되살리지 않는다. 별도 좋아요는 giscus 리액션으로 대체하며 RSS는 만들지 않기로 했다.

## 주요 구조와 유지할 규칙

- src/app/layout.tsx: 헤더와 3열 레이아웃. 크기는 globals.css의 CSS 변수로 관리한다. 오른쪽 열은 @rightPanel 병렬 라우트다. 새 화면 경로에는 슬롯에도 대응 페이지를 추가한다. default.tsx만으로는 클라이언트 이동 시 이전 목차가 남는 문제를 막지 못한다.
- Sidebar.tsx: ProfileCard / About / CategoryList 분리를 유지한다. 카테고리는 계층형이며 공개 글이 없는 가지는 숨긴다. 펼침 상태는 전체 경로를 키로 localStorage에 저장한다.
- src/lib/notion.ts: public_url이 있는 글만 노출한다. 부모 Relation으로 카테고리 경로를 만들고 상위 카테고리에 하위 글을 포함한다. React cache()는 요청 내 중복을 줄이고, src/lib/notion-cache.ts의 Next.js Data Cache는 목록·카테고리·퀴즈 목록을 60초, 본문을 300초 재사용한다. POST /api/notion/revalidate와 x-reindex-secret 헤더로 즉시 만료시킬 수 있다.
- 관련 포스트: 글 DB의 같은 이름 Relation 속성을 읽어 본문과 댓글 사이에 표시한다. 공개된 같은 DB의 글만 API 관계 순서대로 연결하며, 자기 자신·중복은 제외하고 빈 영역은 숨긴다.
- NotionPage.tsx: fullPage=false 유지. 목차는 오른쪽 슬롯에서 별도 생성한다. 본문·댓글 테마는 html.dark를 관찰해 동기화한다. 서드파티 CSS 충돌에 주의한다.
- 조회수 API: viewed_<postId> httpOnly 쿠키로 같은 브라우저에서 24시간 동안 중복 증가를 억제한다. 계정·IP 기준 고유 조회수는 아니다.
- 방문자 API: 1년짜리 visitor_id httpOnly 쿠키를 발급한다. 백엔드는 (VisitorId, Date)로 일별 중복을 막는다. 날짜는 UTC이며 전체 수는 고유 방문자 ID 개수다.
- src/lib/search.ts: 공개 글을 평문으로 추출해 Meilisearch에 보낸다. POST /api/search/reindex와 x-reindex-secret 헤더로 수동 갱신한다.
- backend/Program.cs: 시작 시 DB 마이그레이션 적용. /health/db로 DB 연결을 확인한다. API는 인프라 내부에서 프론트엔드가 호출하는 서비스로 설계됐다.
- SEO: 글·카테고리 메타데이터와 canonical URL, sitemap.xml, robots.txt가 있다. 사이트맵은 요청 시 생성한다.

## 설정과 배포

환경 변수는 [.env.local.example](.env.local.example)을 기준으로 한다. 예시의 GITHUB_TOKEN은 현재 코드에서 사용하지 않는다. DB 연결 문자열은 ConnectionStrings:Default로 주입하고 로컬에서는 dotnet user-secrets를 사용한다.

프론트엔드 기본 포트는 3000, 백엔드 HTTP 프로필은 5145, Meilisearch 기본 포트는 17700이다. 홈서버 연결에는 SSH 설정·터널이 필요하며 현재 PC에서 접근 가능하다고 가정하지 않는다.

Docker Compose·Traefik·Cloudflare Tunnel은 별도 [homeserver-infra](https://github.com/soonsoo3595/homeserver-infra) 저장소에서 관리한다. 이 저장소는 프론트엔드·백엔드 Dockerfile과 로컬 standalone 산출물용 Dockerfile.runtime을 제공한다. NEXT_PUBLIC_*는 빌드 시 고정되며 런타임에 읽는 src/content/about.md는 이미지에 별도로 복사한다.

## 남은 작업

- 모바일 레이아웃: 과거 운영 확인에서 보고된 문제의 원인·해결 여부 재확인.
- 검색: 재인덱싱 자동화, 등록 응답·작업 완료 확인, 비공개·삭제 글 동기화.
- 포트폴리오: 페이지는 미구현이며 헤더 버튼은 사용자 요청으로 제거했다.
- 기타 코드상 제약은 [docs/ISSUES.md](docs/ISSUES.md) 참고.

## 커밋 메시지 규칙

태그 | 내용 형식이며 내용은 한글로 작성한다.

- **Feat** — 신 기능 추가
- **Fix** — 기능 수정
- **Debug** — 버그 수정
- **Refactor** — 리팩토링
- **Docs** — 문서 추가·수정
- **Chore** — 빌드 설정, 의존성, 기능과 무관한 작업
