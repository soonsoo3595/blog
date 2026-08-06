# blog

개인 블로그. 콘텐츠 작성·수정은 본인만, 방문자는 검색·댓글만 이용한다. 개발뿐 아니라 일상 등 다양한 주제를 다루는 블로그다.

@AGENTS.md

## 기술 스택

- **프론트엔드**: Next.js (React, SSG/SSR 유연 선택)
- **백엔드**: .NET (ASP.NET Core Web API)
- **DB**: PostgreSQL — JSONB로 유동적 스키마(태그/메타데이터) 처리, 내장 Full Text Search, permissive 오픈소스 라이선스, Npgsql 드라이버 성숙도가 선택 이유
- **캐시**: Redis
- **콘텐츠 관리**: 자체 마크다운 에디터 대신 **노션(Notion)에서 글을 쓰고, 블로그는 그 페이지를 읽기 전용으로 보여주는 뷰어** 역할만 한다 (`react-notion-x` 등 활용 예정, 아직 미구현). 자체 에디터 UX가 마음에 안 들어서 나온 결정.
- **디자인**: 라이트·다크 모드, 노션 스타일 참고 (변경 가능)

## 콘텐츠와 코드의 분리

이 레포는 public이라, 실제로 작성한 글 내용은 이 레포에 커밋하지 않는다. 글은 배포된 블로그 앱의 UI를 통해 작성하고, 실제 데이터는 서버의 Postgres DB(또는 런타임 데이터 저장 경로)에 저장한다 — [homeserver-infra](https://github.com/soonsoo3595/homeserver-infra) 레포의 `data/`가 git에서 제외되는 것과 같은 원칙. 이 레포에는 애플리케이션 코드만 들어간다.

## 부가 기능

| 영역 | 선택 | 이유 |
|---|---|---|
| 댓글 | giscus (GitHub Discussions) ✅ | 서버·DB 불필요, XSS·스팸 리스크 최소 |
| 검색 | Meilisearch(self-hosted) 또는 클라이언트 사이드 | 읽기 전용이라 리스크 낮음 |
| 분석 | Umami 또는 Plausible(self-hosted) | 프라이버시 친화적 |
| SEO | sitemap.xml ✅ / RSS 자동 생성 (아직) | |

## 인프라

배포·Docker Compose 설정은 이 레포가 아니라 [homeserver-infra](https://github.com/soonsoo3595/homeserver-infra)에서 관리한다 (`DOCKER.md` 컨벤션 참고: 컨테이너 하나당 독립 compose 프로젝트, `backend`/`proxy` 네트워크 등).

## 진행 상황 (2026-08-06 기준)

**프론트엔드 레이아웃을 만드는 중이며, 아직 완성이 아니다.** 사용자가 직접 코드를 보면서 값(간격, 너비, 색상 등)을 계속 조정해나갈 예정이니, 다음 세션에서는 "레이아웃이 최종 확정됐다"고 가정하지 말고 현재 어디까지 됐는지부터 확인할 것.

오늘(2026-08-06) 한 것: 사이드바 카테고리 접기/펼치기(상태 `localStorage` 캐시) + 카테고리별 글 개수 표시, 포스트 상세 오른쪽 열을 `@rightPanel` Parallel Route로 리팩토링(목차를 본문 옆에서 오른쪽 열로 옮겨 본문 폭 확보), GitHub 계정명 하드코딩 제거(`GITHUB_USERNAME` 환경 변수화), Pinned 레포 카드 추가했다가 제거(github-readme-stats 검토 후 보류), 댓글 기능(giscus) 코드 연동 완료.

### 지금까지 만들어진 구조

상세 구현 노트(함정·이유 포함)는 [docs/STRUCTURE.md](docs/STRUCTURE.md) 참고 — 아래 파일들을 고치기 전에 관련 항목을 확인할 것.

- `src/app/layout.tsx` — 헤더 + 3열 그리드(Sidebar/본문/RightPanel), 크기값은 `globals.css`의 `:root` CSS 변수로 모아둠. 오른쪽 열은 `@rightPanel` Parallel Route 슬롯(`src/app/@rightPanel/`)으로 라우트별로 다른 내용을 보여줌(포스트 상세는 목차+통계, 그 외는 통계만) — 함정 있음, 문서 참고
- `src/components/Header.tsx` — 로고 + 블로그 이름 / 검색 → 테마 토글 → 포트폴리오 (알림·설정 버튼은 죽은 기능이라 제거함)
- 관리자 인증 기능은 만들었다가 삭제함(노션 연동으로 불필요해짐) — **되살리지 말 것**
- `src/components/Sidebar.tsx` — `ProfileCard`/`About`/`CategoryList` 조합 (컴포넌트 분리 유지할 것) — 함정 있음, 문서 참고. `CategoryList` → `CategoryTree`(접기/펼치기, 글 개수 표시)는 문서의 `CategoryList.tsx` 항목 참고
- `src/components/RightPanel.tsx` — 방문자 통계(mock) + 광고 자리(미정)
- `src/lib/notion.ts` — 노션 연동 핵심 로직 — **함정 다수, 문서 참고**
- `src/app/categories/[category]/page.tsx` — 카테고리별 글 목록 — 함정 있음, 문서 참고
- `src/components/NotionPage.tsx` — `react-notion-x` 렌더러 — 함정 있음, 문서 참고
- `src/components/TableOfContents.tsx` — 포스트 상세 오른쪽 사이드 목차
- `src/app/posts/[slug]/page.tsx` — 포스트 상세, 제목+날짜+본문+댓글(`Comments.tsx`, giscus). 목차는 `@rightPanel` 슬롯으로 분리됨
- `src/components/Comments.tsx` — giscus 댓글, 동작 확인 완료
- `src/app/page.tsx` — `PostList`만 렌더링, 노션 실데이터 사용
- `src/app/not-found.tsx` — 커스텀 404, **지우면 안 됨**(다크모드 배경 깨지는 버그 있었음)
- `src/lib/mock.ts` — 방문자 통계(`mockStats`)만 남음
- `.env.local`(git 미포함) — 필요한 키 전체와 발급 방법은 `.env.local.example` 참고(노션 토큰/DB 2개, GitHub 계정명·토큰, giscus 설정 4개, 사이트 URL)
- `src/app/globals.css` — 서드파티 CSS 충돌 방어 패턴, 색상 변수 등 — 함정 있음, 문서 참고

### 알려진 이슈 / 미해결

상세 내용은 [docs/ISSUES.md](docs/ISSUES.md) 참고 — 관련 작업을 시작하기 전에 확인할 것.

- 포트폴리오 버튼 미동작 — 블로그 완성 뒤 작업 예정, 의도적 보류 (알림/설정은 헤더에서 제거함)
- 조회수 미구현, 와이어프레임 재검토 필요 (좋아요는 giscus 리액션으로 대체돼 별도 구현 불필요)

### 남은 작업

- [x] ~~노션을 콘텐츠 소스로 연동~~ — 완료. 글 목록/카테고리/상세 페이지(노션 본문 렌더링)까지 실제 노션 데이터로 동작 확인함.
- [x] ~~카테고리 클릭 → 해당 카테고리 문서 목록 페이지~~ — 완료. `/categories/[category]`, 상위/하위 카테고리 둘 다 클릭 가능.
- [x] ~~SEO 기본기~~ — 완료. 글/카테고리별 `generateMetadata`(제목·설명·OG), `sitemap.xml`, `robots.txt` 추가.
- [ ] 검색 기능 실제 동작 (Meilisearch 쪽으로 방향 정함) — **보류: 홈서버 접근 가능해지면 재개**
- [x] ~~댓글 기능~~ — 완료(`Comments.tsx`, giscus). 레포 Discussions 활성화·giscus 앱 설치·`.env.local` 설정값까지 다 끝내고 동작 확인함.
- [ ] 조회수 기능 (로그인 없이 익명 카운트 방식으로 방향 정함) — **보류: .NET+Postgres 로컬 개발 환경(홈서버 접근) 필요, 재개 시 같이 진행**. 좋아요는 giscus의 리액션(`reactionsEnabled="1"`)으로 대체돼서 별도 구현 불필요해짐
- [ ] Cloudflare Tunnel 외부 노출 (레이아웃 어느 정도 정리된 뒤)
- [ ] RSS 자동 생성

## 커밋 메시지 규칙

`[태그] | [내용]` 형식, 내용은 한글로 작성.

- **Feat** — 신 기능 추가
- **Fix** — 기능 수정
- **Debug** — 버그 수정
- **Refactor** — 리팩토링
- **Docs** — 문서 추가/수정
- **Chore** — 빌드 설정, 의존성, 기능과 무관한 잡다한 작업
