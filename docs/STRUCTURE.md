# 구조 상세 노트

CLAUDE.md "지금까지 만들어진 구조"에서 분리한 상세 기록. 아래 파일들을 고치기 전에 관련 항목을 확인할 것 — 다들 한 번씩 삽질하고 알아낸 함정들임.

## `src/app/layout.tsx`

헤더 + 3열 그리드(좌측 Sidebar / 가운데 본문 / 우측 RightPanel). 레이아웃 크기값(너비, 간격)은 전부 `src/app/globals.css`의 `:root` 상단에 CSS 변수(`--layout-max-width`, `--sidebar-width`, `--right-panel-width`, `--layout-gap`)로 모아둠 — 값 조정은 여기서.

## `src/components/Header.tsx`

로고(`public/logo.svg`, 교체 가능) + 블로그 이름 / 우측에 검색창(`SearchBar`) → 알림 → 테마 토글 → 설정 → 포트폴리오 순서.

## 관리자 인증 기능 (삭제됨)

`admin-context.tsx`, `AdminControls.tsx`는 만들었다가 삭제함. 콘텐츠를 노션에서 작성하는 쪽으로 방향을 정하면서, 블로그 자체에 로그인해서 글을 쓰거나 수정할 필요가 없어져서 지금은 불필요한 기능이 됨. 나중에 실제로 로그인이 필요한 기능(예: 댓글 관리자 권한 등)이 생기면 그때 다시 설계할 것 — 예전 mock 방식을 그대로 되살리지 말 것(설계가 허술했음).

## `src/components/Sidebar.tsx`

`ProfileCard` / `About`(마크다운, `src/content/about.md` 수정으로 편집, `remark-gfm` 설치되어 표·취소선·체크박스도 지원) / `CategoryList`(카테고리 목록) 3개 컴포넌트를 조합. **분리 요청에 따라 컴포넌트 파일 단위로 나눠져 있음 — 다시 합치지 말 것.**

### `ProfileCard.tsx`

GitHub 공개 API(`api.github.com/users/<id>`)에서 아바타·아이디·이메일을 서버 컴포넌트에서 fetch(하루 캐시). 이메일은 GitHub에 public으로 설정 안 돼 있으면 표시 안 함. 아바타 오른쪽 아래에 GitHub 프로필로 가는 작은 뱃지 링크 있음. `next.config.ts`에 `avatars.githubusercontent.com` 이미지 도메인 허용 필요.

### `CategoryList.tsx`

노션 데이터베이스의 "상위카테고리"/"카테고리" 두 속성을 조합해 2단 트리로 보여줌(`getCategories()`가 `{ name, subCategories }[]` 반환). "상위카테고리"가 비어있는 글은 "카테고리" 값 자체가 최상위(루트) 항목이 됨(가짜 "미분류" 그룹으로 묶지 않음) — `subCategories`가 빈 배열이면 루트 단독 항목으로 렌더링, 있으면 상위 이름 아래 하위 목록으로 렌더링. 노션 Select 속성 자체엔 계층이 없어서, 상위/하위를 별개 Select 속성으로 각 글에 지정해두고 코드에서 그룹핑하는 방식 — 두 속성이 노션 상에서 서로 검증되진 않으므로(오타·불일치 가능) 값 입력 시 주의. 예전에 mock 기반 계층 구조(`parentId`)로 만든 적 있다가 노션 연동하며 평면으로 단순화했었는데, 다시 계층으로 되돌림.

## `src/components/RightPanel.tsx`

방문자 통계(mock) + "추후 추가"(광고 자리, 아직 미정) 패널.

## `src/lib/notion.ts`

노션 연동 핵심 로직. `@notionhq/client`(공식 API, 데이터베이스 쿼리용)와 `notion-client`(비공식 API, 개별 페이지 본문 렌더링용) 둘 다 씀.

**주의할 점:**

1. `@notionhq/client` v5부터 database 하나가 여러 data source를 가질 수 있게 바뀌어서, `database_id`로 바로 쿼리 못 하고 `databases.retrieve()`로 data source id를 먼저 얻어야 함(`getDataSourceId()`, 프로세스 내 캐싱).
2. `notion-client`(비공식 API)는 페이지가 진짜 "웹에 게시(Publish to web)"로 공개돼 있어도, 서버에서 보내는 요청에 브라우저처럼 보이는 `User-Agent` 헤더가 없으면 노션 쪽 봇 차단에 걸려 403이 남. `NotionAPI` 생성 시 `ofetchOptions.headers`로 우회함.
3. `notion-client`가 반환하는 `recordMap.block[id]`는 `{ value: { value: {...실제 블록...} } }`처럼 이중으로 감싸져 있음 — `.value`만 한 겹 벗기면 `type`이 `undefined`로 나오는 등 헛짚기 쉬움. `notion-utils`의 `getBlockValue()` 헬퍼로 벗겨낼 것 (`posts/[slug]/page.tsx`에서 실제로 겪은 버그).

**데이터 모델:**

- 노션 데이터베이스 속성 이름은 한글로 고정: 제목/슬러그(rich_text)/카테고리(select, 하위)/상위카테고리(select, 상위)/날짜(date).
- 공개 여부는 별도 속성 없이 노션의 "웹에 게시" 여부로 판단한다. 공식 API로 페이지를 조회하면 딸려오는 `public_url` 필드가 게시 시에만 채워지는데, 이 값이 `notion-client`(비공식 API)로 본문을 실제로 가져올 수 있는 조건과 정확히 일치해서, `공개 여부 판단 == 본문 렌더링 가능 여부`가 항상 같이 간다. 원래 "상태"(select, "공개"/"비공개") 속성으로 따로 관리했었으나, 상태=공개인데 "웹에 게시"를 안 켜놓으면 목록엔 뜨는데 상세 페이지가 403으로 깨지는 불일치가 생길 수 있어 `public_url` 단일 기준으로 정리함.
- 슬러그가 비어있는 글은 노션 페이지 id를 URL로 대신 쓰게 되어 있고, `getPostBySlug()`가 그 경우도 조회되도록 폴백 처리되어 있음. 그래도 새 글마다 "슬러그"는 채워주는 게 정상적인 사용법.
- `getPostsByCategory()`는 Notion 쿼리 필터가 아니라 `getPublishedPosts()` 전체를 가져와 코드에서 필터링함. Notion select 필터는 값이 "그 속성에 실제 등록된 옵션"이 아니면 그냥 매칭 안 되는 게 아니라 API가 400 validation_error를 던짐 — "카테고리"에만 있는 값("C++" 등)으로 "상위카테고리"를 필터링하려다 겪은 문제. 상위/하위 어느 쪽 값으로 들어와도 매칭해야 해서(카테고리 목록 링크가 둘 다 같은 라우트로 감) 쿼리 필터로는 안전하게 처리 못 함.

## `src/app/categories/[category]/page.tsx`

Next.js는 동적 라우트 세그먼트(`params`)를 자동으로 `decodeURIComponent` 해주지 않음(App Router 공통 이슈) — 카테고리 값에 `+`처럼 인코딩되는 문자가 있으면(`C++` → `C%2B%2B`) 디코딩 안 한 채로 노션 쪽에 넘어가 매칭 실패함. 페이지에서 직접 `decodeURIComponent(category)` 호출, `CategoryList.tsx`의 링크도 `encodeURIComponent`로 감싸서 생성함.

## `src/components/NotionPage.tsx`

`react-notion-x`의 `NotionRenderer`를 감싼 클라이언트 컴포넌트. `Code`/`Collection`/`Equation`/`Modal`은 무거워서 `next/dynamic`으로 지연 로드.

`darkMode` prop은 `document.documentElement.classList.contains("dark")`를 `MutationObserver`로 지켜보며 실제 테마에 맞춰 넘김 — 예전에 `darkMode={false}`로 고정해뒀다가 라이브러리의 다크모드 전용 스타일(`.dark-mode .notion-callout` 등)이 전혀 적용 안 돼서 다크모드에서 본문이 잘 안 보이는 문제가 있었음.

`fullPage`는 **의도적으로 `false`로 고정**돼 있음. `react-notion-x`의 사이드 목차(`showTableOfContents`/`PageAside`)는 `fullPage={true}`일 때만 렌더링되는 코드 경로라 처음엔 켜봤으나, `fullPage` 모드는 노션 자체 헤더/제목/커버까지 같이 그려서 우리 것과 중복되고, `.dark-mode`가 로컬로 재정의하는 `--bg-color`(노션 자체 다크그레이 `#2f3437`)가 우리 페이지 배경(`#0e1116`)과 달라 목차/속성 박스에서 색이 겉도는 문제가 있었음. 그래서 `fullPage=false` 그대로 두고, 목차는 `posts/[slug]/page.tsx`에서 `notion-utils`의 `getPageTableOfContents`로 직접 만든다 (`TableOfContents.tsx`).

## `src/components/TableOfContents.tsx`

`posts/[slug]/page.tsx`가 `getPageTableOfContents(getBlockValue(recordMap.block[post.id]), recordMap)`로 뽑아낸 목차 항목을 받아 오른쪽에 `position: sticky`로 렌더링하는 순수 프레젠테이션 컴포넌트. 각 항목 링크는 `#${uuidToId(item.id)}` — `react-notion-x`가 헤딩 블록마다 `id={uuidToId(block.id)}`인 앵커 `div`를 이미 심어두므로(일반 블록 렌더링 경로라 `fullPage`와 무관하게 항상 존재) 그냥 브라우저 네이티브 앵커 스크롤로 동작함.

## `src/app/posts/[slug]/page.tsx`

포스트 상세 페이지. `getPostBySlug` → `getPageRecordMap` → 좌우 2단 레이아웃(`flex`)으로 왼쪽엔 제목+날짜+`NotionPage`, 오른쪽엔 `TableOfContents`.

## `src/app/page.tsx`

`PostList`만 렌더링 (검색창은 헤더로 옮김). `PostList`/`CategoryList` 둘 다 이제 mock이 아니라 `src/lib/notion.ts`에서 실제 노션 데이터를 가져옴. `PostList.tsx`는 카드 렌더링 부분을 `PostListView({ posts })`로 분리해서 홈과 `categories/[category]/page.tsx`가 공유함.

## `src/app/not-found.tsx`

커스텀 404 페이지. **이거 없으면 안 됨**: Next.js 기본 404는 `prefers-color-scheme`(OS 설정) 기준으로 자체 스타일을 강제 적용해서, 우리 앱의 다크모드 토글(class 기반)과 충돌해 배경색이 깨지는 버그가 있었음 (커스텀 404로 해결됨).

## `src/lib/mock.ts`

이제 방문자 통계(`mockStats`)만 남아있음. 카테고리/글 mock은 노션 연동으로 대체되어 삭제함.

## `.env.local`

git 미포함, 사용자가 직접 생성. `NOTION_TOKEN`, `NOTION_DATABASE_ID` 필요. 예시는 `.env.local.example` 참고.

## `src/app/globals.css`

- `html body`, `html:root`처럼 일부러 selector를 두 개 결합해 specificity를 높인 규칙들이 있음 — 서드파티 라이브러리가 전역 `body`/`:root` 스타일(색상 등)을 깔아서 우리 테마를 덮어써버리는 문제를 겪은 뒤 넣은 방어 패턴. 새 서드파티 CSS를 붙일 때 비슷한 충돌이 생기면 같은 방식(더 구체적인 selector)을 쓸 것 — 다만 **동일한 specificity의 단일 클래스 선택자끼리는 나중에 로드되는 쪽(react-notion-x)이 이겨버리므로**(`.notion-collection-page-properties`, `.notion-table-of-contents`를 숨힐 때 겪음), 부모 클래스를 하나 더 붙여서(`.notion .xxx`) specificity 자체를 올려야 확실히 이김.
- `--notion-max-width`(react-notion-x 변수, 기본 720px 고정폭)를 `100%`로 오버라이드해둠 — 본문 옆에 목차를 추가한 뒤로 가운데 칼럼이 720px보다 좁아지는 상황이 생겨서, 고정폭 때문에 본문이 넘쳐 우측 패널까지 밀어내는 문제가 있었음.
- 색상: 라이트 모드 텍스트 `#475570` 톤 유지 (사용자 지정), 다크 모드는 Claude가 같은 계열로 임의 조정함 — 필요시 재조정 가능.
