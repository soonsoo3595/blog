# blog

개인 블로그. 콘텐츠 작성·수정은 본인만, 방문자는 검색·댓글만 이용한다. 개발뿐 아니라 일상 등 다양한 주제를 다루는 블로그다.

@AGENTS.md

## 기술 스택

- **프론트엔드**: Next.js (React, SSG/SSR 유연 선택)
- **백엔드**: .NET (ASP.NET Core Web API)
- **DB**: PostgreSQL — JSONB로 유동적 스키마(태그/메타데이터) 처리, 내장 Full Text Search, permissive 오픈소스 라이선스, Npgsql 드라이버 성숙도가 선택 이유
- **캐시**: Redis
- **콘텐츠 관리**: 자체 마크다운 에디터 대신 **노션(Notion)에서 글을 쓰고, 블로그는 그 페이지를 읽기 전용으로 보여주는 뷰어** 역할만 한다 (`react-notion-x` 활용, 구현 완료). 자체 에디터 UX가 마음에 안 들어서 나온 결정.
- **디자인**: 라이트·다크 모드, 노션 스타일 참고 (변경 가능)

## 콘텐츠와 코드의 분리

이 레포는 public이라, 실제로 작성한 글 내용은 이 레포에 커밋하지 않는다. 글은 배포된 블로그 앱의 UI를 통해 작성하고, 실제 데이터는 서버의 Postgres DB(또는 런타임 데이터 저장 경로)에 저장한다 — [homeserver-infra](https://github.com/soonsoo3595/homeserver-infra) 레포의 `data/`가 git에서 제외되는 것과 같은 원칙. 이 레포에는 애플리케이션 코드만 들어간다.

## 부가 기능

| 영역 | 선택 | 이유 |
|---|---|---|
| 댓글 | giscus (GitHub Discussions) ✅ | 서버·DB 불필요, XSS·스팸 리스크 최소 |
| 검색 | Meilisearch(self-hosted) ✅ | 읽기 전용이라 리스크 낮음 |
| 분석 | Umami 또는 Plausible(self-hosted) | 프라이버시 친화적 |
| SEO | sitemap.xml ✅ / RSS 자동 생성 — **하지 않기로 결정** | |

## 인프라

배포·Docker Compose 설정은 이 레포가 아니라 [homeserver-infra](https://github.com/soonsoo3595/homeserver-infra)에서 관리한다 (`DOCKER.md` 컨벤션 참고: 컨테이너 하나당 독립 compose 프로젝트, `backend`/`proxy` 네트워크 등).

## 진행 상황 (2026-08-06 기준)

**프론트엔드 레이아웃을 만드는 중이며, 아직 완성이 아니다.** 사용자가 직접 코드를 보면서 값(간격, 너비, 색상 등)을 계속 조정해나갈 예정이니, 다음 세션에서는 "레이아웃이 최종 확정됐다"고 가정하지 말고 현재 어디까지 됐는지부터 확인할 것.

**데스크탑에서 홈서버로 SSH 키 인증이 새로 설정돼서(`ssh homeserver`), 세션에서 직접 홈서버 Postgres/Meilisearch에 SSH 터널로 접근할 수 있게 됨** — 그동안 "홈서버 접근 가능해지면 재개"로 보류했던 조회수/검색 기능을 오늘 이걸로 재개해서 완료함. 자세한 내용은 [HomeServer/CLAUDE.md](../HomeServer/CLAUDE.md) 참고.

오늘(2026-08-06) 한 것 — 사이드바 카테고리 접기/펼치기(상태 `localStorage` 캐시) + 카테고리별 글 개수 표시, 포스트 상세 오른쪽 열을 `@rightPanel` Parallel Route로 리팩토링(목차를 본문 옆에서 오른쪽 열로 옮겨 본문 폭 확보), GitHub 계정명 하드코딩 제거(`GITHUB_USERNAME` 환경 변수화), 댓글 기능(giscus) 코드 연동 완료. 이어서(같은 날 이어진 세션) `backend/`(.NET Web API) 프로젝트 스캐폴딩과 Postgres 연결, 포스트 조회수 기능(쿠키 기반 하루 1회 카운트), 블로그 방문자 수 기능(`RightPanel`의 mock 데이터 제거), 포스트 상세 오른쪽 열 목차·통계 패널 sticky 겹침 버그 수정 + 사이드바·오른쪽 패널 전체에 sticky 적용, Meilisearch 기반 검색 기능(노션 본문 인덱싱 + 헤더 검색창 실시간 드롭다운)까지 추가함.

### 지금까지 만들어진 구조

상세 구현 노트(함정·이유 포함)는 [docs/STRUCTURE.md](docs/STRUCTURE.md) 참고 — 아래 파일들을 고치기 전에 관련 항목을 확인할 것.

- `src/app/layout.tsx` — 헤더 + 3열 그리드(Sidebar/본문/RightPanel), 크기값은 `globals.css`의 `:root` CSS 변수로 모아둠. 그리드에 `items-start`를 추가해둠(기본값 `stretch`였을 때 오른쪽 열이 본문 높이만큼 늘어나면서 sticky 겹침 버그의 원인이 됐었음). 오른쪽 열은 `@rightPanel` Parallel Route 슬롯(`src/app/@rightPanel/`)으로 라우트별로 다른 내용을 보여줌(포스트 상세는 목차+통계, 그 외는 통계만) — 함정 있음, 문서 참고
- `src/components/Header.tsx` — 로고 + 블로그 이름 / 검색 → 테마 토글 → 포트폴리오 (알림·설정 버튼은 죽은 기능이라 제거함)
- 관리자 인증 기능은 만들었다가 삭제함(노션 연동으로 불필요해짐) — **되살리지 말 것**
- `src/components/Sidebar.tsx` — `ProfileCard`/`About`/`CategoryList` 조합 (컴포넌트 분리 유지할 것) — 함정 있음, 문서 참고. `CategoryList` → `CategoryTree`(접기/펼치기, 글 개수 표시)는 문서의 `CategoryList.tsx` 항목 참고. `sticky top-6`로 스크롤을 따라감
- `src/components/RightPanel.tsx` — 방문자 통계 + 광고 자리(미정). 클라이언트 컴포넌트로 전환, mount 시 `/api/visits`(→ .NET 백엔드 `VisitorLog`)에 방문 기록 후 오늘/전체 방문자 수 표시. mock 제거됨(`src/lib/mock.ts` 삭제). 홈/카테고리/기본 라우트에서는 `sticky top-6` 래퍼로 감싸서 사용(포스트 상세는 아래 `TableOfContents.tsx` 항목 참고)
- `src/lib/notion.ts` — 노션 연동 핵심 로직 — **함정 다수, 문서 참고**
- `src/app/categories/[category]/page.tsx` — 카테고리별 글 목록 — 함정 있음, 문서 참고
- `src/components/NotionPage.tsx` — `react-notion-x` 렌더러 — 함정 있음, 문서 참고
- `src/components/TableOfContents.tsx` — 포스트 상세 오른쪽 사이드 목차. 컴포넌트 자체는 더 이상 sticky를 갖지 않음 — `src/app/@rightPanel/posts/[slug]/page.tsx`가 목차+통계를 하나의 `sticky top-6` 그룹으로 묶어서 렌더링함 (각자 따로 sticky였다가 스크롤 중 서로 겹치는 버그가 있어서 수정)
- `src/app/posts/[slug]/page.tsx` — 포스트 상세, 제목+날짜+조회수(`ViewCounter.tsx`)+본문+댓글(`Comments.tsx`, giscus). 목차는 `@rightPanel` 슬롯으로 분리됨
- `src/components/Comments.tsx` — giscus 댓글, 동작 확인 완료
- `src/components/ViewCounter.tsx`, `src/lib/views.ts`, `src/app/api/views/[postId]/route.ts` — 포스트 조회수. `views.ts`가 .NET 백엔드(`PostView`)와 통신, Route Handler가 `httpOnly` 쿠키(`viewed_<postId>`, 24시간)로 하루 1회만 카운트되게 함
- `src/lib/visits.ts`, `src/app/api/visits/route.ts` — 블로그 방문자 수. Route Handler가 `visitor_id` 쿠키(1년, `httpOnly`)를 발급하고 .NET 백엔드(`VisitorLog`)에 방문 기록
- `src/lib/search.ts`, `src/app/api/search/route.ts`, `src/app/api/search/reindex/route.ts`, `src/components/SearchBar.tsx` — Meilisearch 기반 검색. `search.ts`가 노션 글 본문을 `notion-utils`로 평문 추출해 인덱싱. 재인덱싱은 `/api/search/reindex`를 `x-reindex-secret` 헤더로 호출해야 함(자동 트리거 없음 — 노션에서 글 수정해도 자동 반영 안 됨, 수동으로 다시 호출 필요)
- `backend/` — .NET Web API 백엔드(`Blog.Api`). `PostView`(조회수), `VisitorLog`(방문자 수) 두 테이블, EF Core + Npgsql로 홈서버 Postgres의 `blog` DB에 연결. 로컬 개발 시 `ssh -L 15432:localhost:15432 homeserver` 터널 필요, 연결 문자열은 `dotnet user-secrets`로 관리(레포에 안 남음). `dotnet run`으로 `http://localhost:5145`에서 실행(포트는 `Properties/launchSettings.json`)
- `.env.local`(git 미포함) — 필요한 키 전체와 발급 방법은 `.env.local.example` 참고(노션 토큰/DB 2개, GitHub 계정명·토큰, giscus 설정 4개, 사이트 URL, `BACKEND_API_URL`, Meilisearch 호스트·API 키, `REINDEX_SECRET`)
- `src/app/globals.css` — 서드파티 CSS 충돌 방어 패턴, 색상 변수 등 — 함정 있음, 문서 참고

### 알려진 이슈 / 미해결

상세 내용은 [docs/ISSUES.md](docs/ISSUES.md) 참고 — 관련 작업을 시작하기 전에 확인할 것.

- 포트폴리오 버튼 미동작 — 블로그 완성 뒤 작업 예정, 의도적 보류 (알림/설정은 헤더에서 제거함)
- Meilisearch 재인덱싱이 수동 트리거(`/api/search/reindex`)뿐이라, 노션에서 글을 쓰거나 수정해도 검색 결과에 자동 반영되지 않음 — Jenkins 배포 파이프라인에 붙이거나 주기적 cron 등으로 자동화하는 게 남은 과제
- 조회수/방문자 수는 로컬 개발 중 쌓인 값이라 **실제 배포 시 `PostView`/`VisitorLog` 테이블을 리셋하고 시작할 것** (사용자가 명시적으로 요청함)

### 남은 작업

- [x] ~~노션을 콘텐츠 소스로 연동~~ — 완료. 글 목록/카테고리/상세 페이지(노션 본문 렌더링)까지 실제 노션 데이터로 동작 확인함.
- [x] ~~카테고리 클릭 → 해당 카테고리 문서 목록 페이지~~ — 완료. `/categories/[category]`, 상위/하위 카테고리 둘 다 클릭 가능.
- [x] ~~SEO 기본기~~ — 완료. 글/카테고리별 `generateMetadata`(제목·설명·OG), `sitemap.xml`, `robots.txt` 추가.
- [x] ~~검색 기능 실제 동작~~ — 완료. Meilisearch를 홈서버 컨테이너로 띄우고, 노션 글 본문을 인덱싱해 헤더 검색창에서 실시간 드롭다운으로 결과 표시. 재인덱싱은 아직 수동(위 "알려진 이슈" 참고).
- [x] ~~댓글 기능~~ — 완료(`Comments.tsx`, giscus). 레포 Discussions 활성화·giscus 앱 설치·`.env.local` 설정값까지 다 끝내고 동작 확인함.
- [x] ~~조회수 기능~~ — 완료. `.NET+Postgres` 백엔드(`backend/`)를 새로 만들고 쿠키 기반 하루 1회 카운트로 구현. 같이 진행하기로 했던 블로그 방문자 수(`RightPanel`)도 함께 완료. 좋아요는 giscus의 리액션(`reactionsEnabled="1"`)으로 대체돼서 별도 구현 불필요.
- [ ] Cloudflare Tunnel 외부 노출 — **보류: 도메인 미보유.** 도메인 구매·Cloudflare 등록 후 재개 (레이아웃도 그 전까지 계속 정리)
- ~~RSS 자동 생성~~ — **하지 않기로 결정** (더 이상 진행하지 않음)

## 커밋 메시지 규칙

`[태그] | [내용]` 형식, 내용은 한글로 작성.

- **Feat** — 신 기능 추가
- **Fix** — 기능 수정
- **Debug** — 버그 수정
- **Refactor** — 리팩토링
- **Docs** — 문서 추가/수정
- **Chore** — 빌드 설정, 의존성, 기능과 무관한 잡다한 작업
