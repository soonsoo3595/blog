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
| 댓글 | giscus (GitHub Discussions) | 서버·DB 불필요, XSS·스팸 리스크 최소 |
| 검색 | Meilisearch(self-hosted) 또는 클라이언트 사이드 | 읽기 전용이라 리스크 낮음 |
| 분석 | Umami 또는 Plausible(self-hosted) | 프라이버시 친화적 |
| SEO | sitemap.xml, RSS 자동 생성 | |

## 인프라

배포·Docker Compose 설정은 이 레포가 아니라 [homeserver-infra](https://github.com/soonsoo3595/homeserver-infra)에서 관리한다 (`DOCKER.md` 컨벤션 참고: 컨테이너 하나당 독립 compose 프로젝트, `backend`/`proxy` 네트워크 등).

## 진행 상황 (2026-08-05 기준)

**프론트엔드 레이아웃을 만드는 중이며, 아직 완성이 아니다.** 사용자가 직접 코드를 보면서 값(간격, 너비, 색상 등)을 계속 조정해나갈 예정이니, 다음 세션에서는 "레이아웃이 최종 확정됐다"고 가정하지 말고 현재 어디까지 됐는지부터 확인할 것.

### 지금까지 만들어진 구조

- `src/app/layout.tsx` — 헤더 + 3열 그리드(좌측 Sidebar / 가운데 본문 / 우측 RightPanel). 레이아웃 크기값(너비, 간격)은 전부 `src/app/globals.css`의 `:root` 상단에 CSS 변수(`--layout-max-width`, `--sidebar-width`, `--right-panel-width`, `--layout-gap`)로 모아둠 — 값 조정은 여기서.
- `src/components/Header.tsx` — 로고(`public/logo.svg`, 교체 가능) + 블로그 이름 / 우측에 검색창(`SearchBar`) → 알림 → 테마 토글 → 설정 → 포트폴리오 순서.
- **관리자 인증 기능(`admin-context.tsx`, `AdminControls.tsx`)은 만들었다가 삭제함.** 콘텐츠를 노션에서 작성하는 쪽으로 방향을 정하면서, 블로그 자체에 로그인해서 글을 쓰거나 수정할 필요가 없어져서 지금은 불필요한 기능이 됨. 나중에 실제로 로그인이 필요한 기능(예: 댓글 관리자 권한 등)이 생기면 그때 다시 설계할 것 — 예전 mock 방식을 그대로 되살리지 말 것(설계가 허술했음).
- `src/components/Sidebar.tsx` — `ProfileCard` / `About`(마크다운, `src/content/about.md` 수정으로 편집, `remark-gfm` 설치되어 표·취소선·체크박스도 지원) / `CategoryList`(카테고리 목록) 3개 컴포넌트를 조합. **분리 요청에 따라 컴포넌트 파일 단위로 나눠져 있음 — 다시 합치지 말 것.**
  - `ProfileCard.tsx` — GitHub 공개 API(`api.github.com/users/<id>`)에서 아바타·아이디·이메일을 서버 컴포넌트에서 fetch(하루 캐시). 이메일은 GitHub에 public으로 설정 안 돼 있으면 표시 안 함. 아바타 오른쪽 아래에 GitHub 프로필로 가는 작은 뱃지 링크 있음. `next.config.ts`에 `avatars.githubusercontent.com` 이미지 도메인 허용 필요.
  - `CategoryList.tsx` — `mock.ts`의 `parentId` 기반 계층 구조를 트리로 렌더링, 하위 카테고리 있는 항목만 화살표 토글(기본 접힘)로 펼침.
- `src/components/RightPanel.tsx` — 방문자 통계(mock) + "추후 추가"(광고 자리, 아직 미정) 패널.
- `src/app/page.tsx` — `PostList`만 렌더링 (검색창은 헤더로 옮김).
- `src/app/not-found.tsx` — 커스텀 404 페이지. **이거 없으면 안 됨**: Next.js 기본 404는 `prefers-color-scheme`(OS 설정) 기준으로 자체 스타일을 강제 적용해서, 우리 앱의 다크모드 토글(class 기반)과 충돌해 배경색이 깨지는 버그가 있었음 (커스텀 404로 해결됨).
- `src/lib/mock.ts` — 카테고리(계층형, `id`/`parentId`/`slug`)/글/방문자 통계 임시 데이터. **백엔드(.NET+Postgres) 연결되면 이 파일과 그걸 참조하는 코드는 전부 실제 데이터 연동으로 교체해야 함.**
- `src/app/globals.css`에 `html body`, `html:root`처럼 일부러 selector를 두 개 결합해 specificity를 높인 규칙들이 있음 — 서드파티 라이브러리가 전역 `body`/`:root` 스타일(색상 등)을 깔아서 우리 테마를 덮어써버리는 문제를 겪은 뒤 넣은 방어 패턴. 새 서드파티 CSS를 붙일 때 비슷한 충돌이 생기면 같은 방식(더 구체적인 selector) 참고.
- 색상: 라이트 모드 텍스트 `#475570` 톤 유지 (사용자 지정), 다크 모드는 Claude가 같은 계열로 임의 조정함 — 필요시 재조정 가능.

### 알려진 이슈 / 미해결

- **다크모드 토글 아이콘이 페이지 이동 직후 순간적으로 깜빡이거나(리마운트 시) 잘못된 아이콘으로 고정되는 문제**를 여러 번 시도해 고쳤으나(`ThemeToggle.tsx`), 사용자가 마지막으로 확인했을 때도 완전히 해결됐는지 재확인 전이었음. 최신 구현은 "마운트 전엔 아이콘을 그리지 않다가 마운트 직후에만 실제 DOM 상태로 확정" 방식(`mounted` state 게이팅). 재현되면 `document.documentElement.classList`, `localStorage.getItem('theme')`, `getComputedStyle(...).backgroundColor` 순으로 직접 브라우저 콘솔에서 확인하며 디버깅했음 — 같은 방식 참고.
- 알림/설정/포트폴리오 버튼은 UI만 있고 동작 없음.
- 조회수·좋아요·댓글 등은 아직 미구현. "로그인 시 수정 버튼" 같은 와이어프레임 목표는 콘텐츠를 노션에서 쓰기로 하면서 **더 이상 필요 없어졌을 가능성이 큼** (수정도 노션에서 하면 되므로) — 다음 세션에서 이 부분 와이어프레임 자체를 재검토할 것.

### 남은 작업

- [ ] 노션을 콘텐츠 소스로 연동 (Notion API 토큰/페이지 또는 데이터베이스 ID 필요 — 사용자에게 확인), `react-notion-x`로 포스트 상세 페이지에서 렌더링
- [ ] 노션 페이지 목록을 어떻게 "글 목록"(카테고리, 날짜 등 메타데이터)으로 가져올지 설계 (노션 데이터베이스의 속성을 메타데이터로 매핑하는 방식이 유력)
- [ ] 카테고리 클릭 → 해당 카테고리 문서 목록 페이지
- [ ] 검색 기능 실제 동작
- [ ] 조회수/좋아요/댓글 기능 필요 여부 및 방식 재검토 (수정 기능은 노션 자체로 대체되어 불필요해짐)
- [ ] .NET 백엔드 + Postgres 스키마 설계 (조회수·좋아요 등 노션이 못 다루는 부가 데이터용으로 필요할 수 있음 — 범위 재검토)
- [ ] Cloudflare Tunnel 외부 노출 (레이아웃 어느 정도 정리된 뒤)

## 커밋 메시지 규칙

`[태그] | [내용]` 형식, 내용은 한글로 작성.

- **Feat** — 신 기능 추가
- **Fix** — 기능 수정
- **Debug** — 버그 수정
- **Refactor** — 리팩토링
- **Docs** — 문서 추가/수정
- **Chore** — 빌드 설정, 의존성, 기능과 무관한 잡다한 작업
