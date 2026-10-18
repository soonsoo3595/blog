# 구조 상세 노트

2026-10-18 저장소 코드 기준으로 대조한 구현 노트. 파일 수정 전에 관련 항목을 확인한다. 운영 서버·외부 서비스 연결은 검증하지 않았다. 남은 작업과 코드상 제약은 [ISSUES.md](ISSUES.md)를 참고한다.

## `src/app/layout.tsx`

헤더 + 3열 그리드(좌측 Sidebar / 가운데 본문 / 우측 RightPanel). 레이아웃 크기값(너비, 간격)은 전부 `src/app/globals.css`의 `:root` 상단에 CSS 변수(`--layout-max-width`, `--sidebar-width`, `--right-panel-width`, `--layout-gap`)로 모아둠 — 값 조정은 여기서. `metadata`에 `metadataBase`(`NEXT_PUBLIC_SITE_URL` 기준)와 `title.template`("%s | 뎁밥")를 설정해둬서, 하위 페이지는 `generateMetadata`에서 짧은 제목만 넘기면 자동으로 접미사가 붙음.

오른쪽 열은 `{children}`처럼 고정 컴포넌트가 아니라 **Parallel Routes**(`@rightPanel` 슬롯, `rightPanel` prop)로 라우트별로 다른 내용을 보여준다 — 포스트 상세 페이지에서 본문 폭이 너무 좁아 보인다는 피드백으로, 목차를 본문 옆(`main` 컬럼 안에서 `article`과 `flex`로 나눠 쓰던 방식)이 아니라 이 오른쪽 열로 옮기면서 도입함.

**함정**: 처음엔 `@rightPanel/posts/[slug]/page.tsx`(목차+통계)와 `@rightPanel/default.tsx`(그 외 전부 — 통계만) 두 개만 만들었는데, 포스트 상세를 봤다가 `Link`로 홈에 돌아가면 목차가 그대로 남아있는 버그가 있었음. Next.js Parallel Routes는 **소프트 내비게이션(클라이언트 사이드 라우팅) 중에는 새 URL에 그 슬롯의 명시적 `page.tsx`가 없으면 `default.tsx`로 안 넘어가고 이전에 렌더링된 내용을 그대로 유지**함 — `default.tsx`는 최초 로드/새로고침(하드 내비게이션)이나 404 방지용 폴백일 뿐, 소프트 내비게이션 중 슬롯 전환을 보장하지 않음. 그래서 `children` 쪽에 실제로 존재하는 라우트마다 `@rightPanel` 밑에도 명시적 `page.tsx`를 하나씩 다 만들어둠: `@rightPanel/page.tsx`(홈, `/`), `@rightPanel/categories/[category]/page.tsx`(카테고리), `@rightPanel/posts/[slug]/page.tsx`(포스트 상세). `default.tsx`는 이 셋 중 어디에도 안 걸리는 진짜 미지정 라우트(예: 404)를 위한 최후의 폴백으로만 남겨둠. **앞으로 `children`에 새 라우트를 추가하면 `@rightPanel` 밑에도 같은 경로로 `page.tsx`를 반드시 같이 만들 것** — 안 그러면 위와 같은 스테일 콘텐츠 버그가 재발함.

## `src/components/Header.tsx`

로고(라이트: `public/logo-light.png`, 다크: `public/logo.png`) + 블로그 이름 / 우측에 검색창(`SearchBar`) → 테마 토글 → 포트폴리오 순서. 알림·설정 버튼은 UI만 있고 계획도 없던 죽은 기능이라 제거함 — 포트폴리오는 블로그 완성 후 작업 예정이라 의도적으로 남겨둠([ISSUES.md](ISSUES.md) 참고).

## 관리자 인증 기능 (삭제됨)

`admin-context.tsx`, `AdminControls.tsx`는 만들었다가 삭제함. 콘텐츠를 노션에서 작성하는 쪽으로 방향을 정하면서, 블로그 자체에 로그인해서 글을 쓰거나 수정할 필요가 없어져서 지금은 불필요한 기능이 됨. 나중에 실제로 로그인이 필요한 기능(예: 댓글 관리자 권한 등)이 생기면 그때 다시 설계할 것 — 예전 mock 방식을 그대로 되살리지 말 것(설계가 허술했음).

## `src/components/Sidebar.tsx`

`ProfileCard` / `About`(마크다운, `src/content/about.md` 수정으로 편집, `remark-gfm` 설치되어 표·취소선·체크박스도 지원) / `CategoryList`(카테고리 목록) 3개 컴포넌트를 조합. **분리 요청에 따라 컴포넌트 파일 단위로 나눠져 있음 — 다시 합치지 말 것.**

### `ProfileCard.tsx`

GitHub 공개 API(`api.github.com/users/<id>`)에서 아바타·아이디·이메일을 서버 컴포넌트에서 fetch(하루 캐시). 이메일은 GitHub에 public으로 설정 안 돼 있으면 표시 안 함. 아바타 오른쪽 아래에 GitHub 프로필로 가는 작은 뱃지 링크 있음. `next.config.ts`에 `avatars.githubusercontent.com` 이미지 도메인 허용 필요. 조회할 계정명은 코드에 하드코딩하지 않고 `GITHUB_USERNAME` 환경 변수(`.env.local`)로 뺐음 — 서버 컴포넌트 안에서만 쓰여서(클라이언트 번들에 안 들어감) `NEXT_PUBLIC_` 접두사 없이도 됨.

### `CategoryList.tsx`

카테고리는 이제 **별도 "카테고리" 노션 데이터베이스**(제목 속성 "이름" + "상위카테고리")로 관리한다. 재귀적 계층(개발 > 게임 > 언리얼처럼 깊이 제한 없이)을 지원하려고, 예전의 "카테고리"/"상위카테고리" 2단 Select 방식에서 이걸로 바꿈.

"상위카테고리"는 노션의 **"하위 항목"(Sub-items) 기능**으로 만든 짝 속성인 "상위 항목"(Parent item)의 이름을 "상위카테고리"로 바꿔서 쓰는 것 — 진짜 Relation. 이 기능을 쓰기 전에 두 번 삽질했음: (1) 처음엔 그냥 Relation 속성 하나를 직접 만들어 같은 DB를 가리키는 self-relation으로 썼는데, 노션이 양방향으로 자동 동기화해서(C++의 상위카테고리를 개발로 지정하면 개발의 상위카테고리에도 자동으로 C++이 채워짐) 부모/자식 방향을 구분할 수 없었음. (2) 그래서 Select + 부모 이름 텍스트로 우회했다가, 노션이 정확히 이 문제(계층 구조)를 위해 만들어둔 "하위 항목" 기능을 찾아서 다시 Relation으로 전환함 — "상위 항목"(부모, 직접 편집)과 "하위 항목"(자식 목록, 반대 방향 읽기 전용 뷰)이 처음부터 별개 속성으로 분리돼 있어서 self-relation 문제가 없음. 글 DB의 "카테고리" 속성 자체는 이 카테고리 DB를 가리키는 별개의 **Relation**이고, 이건 서로 다른 두 DB 간 관계라 애초에 방향성 문제가 없었음.

`getCategories()`(`src/lib/notion.ts`)가 카테고리 DB를 통째로 가져와 `CategoryTreeNode[]`(`{ name, postCount, children }` 재귀 구조) 트리로 만들어 반환한다. 각 노드에서 `postCount > 0`인 경우만 남겨, 자기 자신과 하위 카테고리에 공개 글이 없는 가지는 숨긴다.

`CategoryList.tsx`(서버 컴포넌트)는 데이터만 가져오고, 실제 트리 렌더링은 `CategoryTree.tsx`(클라이언트 컴포넌트)에 위임한다 — 접기/펼치기 상태(`useState`)를 다뤄야 해서 분리함. 각 노드의 화살표 버튼을 누르면 접히고, 펼침 상태는 전체 경로(예: `"개발/게임/언리얼"`)를 키로 해서 `localStorage`(`categoryTree:collapsed`)에 저장 — 이름만으로는 서로 다른 상위 카테고리 아래 동명 카테고리가 있을 때 충돌할 수 있어서 경로 전체를 씀. 서버 렌더링 시점엔 localStorage에 접근할 수 없어 항상 "전체 펼침"으로 그리고, 마운트 후 `useEffect`에서 저장된 상태를 반영한다(하이드레이션 불일치 방지) — 이 때문에 `setState`를 effect 안에서 동기 호출하게 되어 `react-hooks/set-state-in-effect` 린트 규칙에 걸리는데, 의도된 패턴이라 해당 줄만 `eslint-disable-next-line`으로 넘김. 하위 카테고리 목록의 들여쓰기는 세로선(`border-l`) 대신 `list-disc` 불릿으로 표시.

각 `CategoryTreeNode`는 `postCount`(자기 자신 + 모든 하위 카테고리에 속한 공개 글 수)를 갖고 있어 이름 옆에 `(13)`처럼 보여준다. `getCategories()`가 `getPublishedPosts()`도 같이 불러와 각 post의 `categoryPath`(경로의 모든 레벨) 이름별로 카운트를 집계함 — `getPostsByCategory`가 경로 어느 레벨이든 매칭하는 것과 같은 기준이라, 상위 카테고리의 숫자는 하위 카테고리 글까지 포함한 값이다.

## `src/components/RightPanel.tsx`

실제 방문자 통계 + "추후 추가"(광고 자리, 아직 미정) 패널. 클라이언트 컴포넌트로 마운트 시 `/api/visits`에 POST하여 실제 통계를 가져온다. 라우트는 직접 판단하지 않으며, 어느 라우트에서 보여줄지는 `src/app/@rightPanel/`(위 `layout.tsx` 항목 참고)이 결정한다.

## `src/lib/notion.ts`

노션 연동 핵심 로직. `@notionhq/client`(공식 API, 데이터베이스 쿼리용)와 `notion-client`(비공식 API, 개별 페이지 본문 렌더링용) 둘 다 씀. 이제 데이터베이스가 **글 DB**(`NOTION_DATABASE_ID`)와 **카테고리 DB**(`NOTION_CATEGORY_DATABASE_ID`) 두 개라, `getDataSourceId(databaseId)`가 database_id별로 결과를 캐싱하도록 일반화돼 있음.

**주의할 점:**

1. `@notionhq/client` v5부터 database 하나가 여러 data source를 가질 수 있게 바뀌어서, `database_id`로 바로 쿼리 못 하고 `databases.retrieve()`로 data source id를 먼저 얻어야 함(`getDataSourceId()`).
2. `notion-client`(비공식 API)는 페이지가 진짜 "웹에 게시(Publish to web)"로 공개돼 있어도, 서버에서 보내는 요청에 브라우저처럼 보이는 `User-Agent` 헤더가 없으면 노션 쪽 봇 차단에 걸려 403이 남. `NotionAPI` 생성 시 `ofetchOptions.headers`로 우회함.
3. `notion-client`가 반환하는 `recordMap.block[id]`는 `{ value: { value: {...실제 블록...} } }`처럼 이중으로 감싸져 있음 — `.value`만 한 겹 벗기면 `type`이 `undefined`로 나오는 등 헛짚기 쉬움. `notion-utils`의 `getBlockValue()` 헬퍼로 벗겨낼 것 (`posts/[slug]/page.tsx`에서 실제로 겪은 버그).
4. Notion API는 한 번에 최대 100개까지만 주고 나머지는 `has_more`/`next_cursor`로 따로 요청해야 함 — 글이 100개 넘으면 조용히 누락되는 걸 막기 위해 `getPublishedPosts()`(전체 조회용)는 `has_more`가 false가 될 때까지 커서를 따라가며 전부 모음.

**데이터 모델:**

- 글 DB 속성: 제목/슬러그(rich_text)/카테고리(**Relation**, 카테고리 DB를 가리킴)/날짜(created_time, 아래 참고).
- 카테고리 DB 속성: 이름(title)/상위카테고리(**Relation**, 노션 "하위 항목" 기능의 짝 속성 "상위 항목"을 이 이름으로 바꿔서 씀 — 위 `CategoryList.tsx` 항목 참고). `resolveCategoryPath()`가 글의 카테고리 Relation id로 해당 카테고리 행을 찾은 뒤, "상위카테고리" id를 계속 따라 올라가며 `[루트, ..., 리프]` 이름 배열(`Post.categoryPath`)을 만든다. 카테고리가 없으면 `["미분류"]`. 정상적으로는 순환이 생길 수 없지만 혹시 모를 실수 대비로 방문한 id를 추적해 무한루프를 막는 방어 로직이 있음(`getCategories()`의 트리 조립에도 동일하게 있음).
- "날짜" 속성은 일반 date가 아니라 노션 자동 "생성 일시"(Created time) 타입 — API 응답이 `{ date: { start } }`가 아니라 `{ created_time: "ISO문자열" }`이라 헷갈리기 쉬움.
- 공개 여부는 별도 속성 없이 노션의 "웹에 게시" 여부로 판단한다. 공식 API로 페이지를 조회하면 딸려오는 `public_url` 필드가 게시 시에만 채워지는데, 이 값이 `notion-client`(비공식 API)로 본문을 실제로 가져올 수 있는 조건과 정확히 일치해서, `공개 여부 판단 == 본문 렌더링 가능 여부`가 항상 같이 간다.
- 슬러그가 비어있는 글은 노션 페이지 id를 URL로 대신 쓰게 되어 있고, `getPostBySlug()`가 그 경우도 조회되도록 폴백 처리되어 있음. 그래도 새 글마다 "슬러그"는 채워주는 게 정상적인 사용법.
- `getPostsByCategory(name)`은 Notion 쿼리 필터가 아니라 `getPublishedPosts()` 전체를 가져와 `post.categoryPath.includes(name)`으로 코드에서 매칭함(경로의 어느 레벨 이름이든 매칭 — 상위/하위 카테고리 링크가 둘 다 같은 `/categories/[category]` 라우트로 감). Relation을 노션 쿼리 필터로 거르는 것도 예전 Select 필터 400 에러와 비슷하게 까다로워서 이 방식을 유지함.
- `getPostBySlug()`, `getPublishedPosts()`는 같은 요청 안에서 여러 컴포넌트가 각자 호출해도 중복 조회 안 나가도록 React `cache()`로 감싸둠.

**홈 목록 페이지네이션(`getPublishedPostsPage`):** 글이 많아져도 페이지 번호 클릭으로 바로 이동 가능해야 해서(노션 커서는 순서대로만 넘어가고 임의 점프가 안 됨), 매번 처음부터 "그 페이지까지 필요한 만큼"(`page * pageSize + 1`, 다음 페이지 존재 여부 판단용으로 1개 더)만 요청한다. 정렬 기준이 항상 같아서 결과는 매번 일관됨. 카테고리 페이지는 카테고리 필터를 이런 식으로 못 걸어서(위 참고) 여전히 전체 조회 후 배열을 잘라 페이지네이션함 — `src/components/Pagination.tsx`가 `totalPages`(전체 앎, 카테고리 페이지)와 `hasNextPage`(전체 모름, 홈) 두 모드를 다 지원.

## `src/app/categories/[category]/page.tsx`

현재 카테고리 페이지는 동적 라우트 값에 명시적으로 `decodeURIComponent`를 적용한다 — 카테고리 값에 `+`처럼 인코딩되는 문자가 있으면(`C++` → `C%2B%2B`) 디코딩 안 한 채로 노션 쪽에 넘어가 매칭 실패함. 페이지에서 직접 `decodeURIComponent(category)` 호출, `CategoryTree.tsx`의 링크도 `encodeURIComponent`로 감싸서 생성함. `generateMetadata`로 카테고리별 제목/설명도 설정.

## `src/components/NotionPage.tsx`

`react-notion-x`의 `NotionRenderer`를 감싼 클라이언트 컴포넌트. `Code`/`Collection`/`Equation`/`Modal`은 무거워서 `next/dynamic`으로 지연 로드.

`darkMode` prop은 `document.documentElement.classList.contains("dark")`를 `MutationObserver`로 지켜보며 실제 테마에 맞춰 넘김 — 예전에 `darkMode={false}`로 고정해뒀다가 라이브러리의 다크모드 전용 스타일(`.dark-mode .notion-callout` 등)이 전혀 적용 안 돼서 다크모드에서 본문이 잘 안 보이는 문제가 있었음.

`fullPage`는 **의도적으로 `false`로 고정**돼 있음. `react-notion-x`의 사이드 목차(`showTableOfContents`/`PageAside`)는 `fullPage={true}`일 때만 렌더링되는 코드 경로라 처음엔 켜봤으나, `fullPage` 모드는 노션 자체 헤더/제목/커버까지 같이 그려서 우리 것과 중복되고, `.dark-mode`가 로컬로 재정의하는 `--bg-color`(노션 자체 다크그레이 `#2f3437`)가 우리 페이지 배경(`#0e1116`)과 달라 목차/속성 박스에서 색이 겉도는 문제가 있었음. 그래서 `fullPage=false` 그대로 두고, 목차는 `src/app/@rightPanel/posts/[slug]/page.tsx`에서 `notion-utils`의 `getPageTableOfContents`로 직접 만든다 (`TableOfContents.tsx`).

## `src/components/TableOfContents.tsx`

`getPageTableOfContents(getBlockValue(recordMap.block[post.id]), recordMap)`로 뽑아낸 목차 항목을 받아 렌더링하는 순수 프레젠테이션 컴포넌트. 각 항목 링크는 `#${uuidToId(item.id)}` — `react-notion-x`가 헤딩 블록마다 `id={uuidToId(block.id)}`인 앵커 `div`를 이미 심어두므로(일반 블록 렌더링 경로라 `fullPage`와 무관하게 항상 존재) 그냥 브라우저 네이티브 앵커 스크롤로 동작함. 예전엔 `posts/[slug]/page.tsx`가 직접 렌더링했지만, 지금은 `src/app/@rightPanel/posts/[slug]/page.tsx`가 이 계산과 렌더링을 맡는다(위 `layout.tsx`/`RightPanel.tsx` 항목 참고) — 본문 폭을 넓히려고 오른쪽 열로 옮김. 목차 자체에는 sticky가 없고 슬롯이 목차와 통계를 하나의 `sticky top-6` 그룹으로 묶어 겹침을 방지한다.

## `src/components/Pagination.tsx`

`currentPage`/`basePath` + (`totalPages` 또는 `hasNextPage`) 둘 중 하나를 받는 유니온 타입. 총 페이지 수를 아는 곳(카테고리 페이지, 전체 조회라서 앎)은 번호를 전부 보여주고, 모르는 곳(홈, 커서 기반이라 다음 페이지 존재 여부만 앎)은 이전/다음만 보여줌. 페이지가 1개뿐이면 `null` 반환.

## `src/app/posts/[slug]/page.tsx`

포스트 상세 페이지. `getPostBySlug` → `getPageRecordMap` → 제목+날짜+`NotionPage`만 세로로 렌더링(`article`이 `main` 컬럼 전체 폭을 씀). `generateMetadata`로 글별 제목/설명/OG 태그 설정, `getPostBySlug`가 `cache()`로 감싸져 있어 메타데이터용 호출과 본문용 호출이 중복 API 요청을 안 만듦.

목차는 더 이상 여기서 렌더링하지 않는다 — `src/app/@rightPanel/posts/[slug]/page.tsx`(같은 `posts/[slug]` 경로를 미러링하는 Parallel Route 슬롯)로 옮겼다. 그 슬롯도 `getPostBySlug`/`getPageRecordMap`을 독립적으로 호출하는데, 둘 다 `cache()`로 감싸져 있어(같은 요청 안에서 같은 인자면) 실제 노션 API 호출은 한 번만 나간다. 존재하지 않는 slug면 이 페이지는 `notFound()`를 던지지만, `@rightPanel` 슬롯 쪽은 그냥 `null`을 반환하도록 해뒀다 — `notFound()`는 페이지 전체를 404로 대체하므로 슬롯이 따로 에러를 던질 필요가 없음.

본문(`NotionPage`) 아래에 `RelatedPosts`(관련 포스트), `Comments`(giscus)를 순서대로 표시한다.

### 관련 포스트

글 DB의 `관련 포스트` Relation 속성은 같은 글 DB의 다른 글을 가리킨다. `getRelatedPosts(postId)`는 사이드바와 공유하는 요청 내 공개 페이지 조회를 재사용해 관계 대상의 제목·슬러그·카테고리를 얻는다. 관계 응답의 `has_more`가 켜져 있으면 속성 API의 커서를 따라 나머지도 읽는다.

Notion API가 반환한 관계 순서를 유지하되, 자기 자신·중복·비공개·삭제·다른 DB의 페이지는 제외한다. `RelatedPosts.tsx`는 블로그 내부 `/posts/[slug]` 링크를 렌더링하며 표시할 글이 없으면 제목과 영역을 모두 숨긴다. 역방향 관계를 블로그에서 임의로 추가하거나 같은 카테고리 글을 자동 추천하지 않는다. 속성 이름은 `관련 포스트`와 정확히 일치해야 한다.

검증: `node --test tests/related-posts.test.mjs`로 공개 여부·순서·중복·슬러그 폴백·관계 페이지네이션·빈 UI와 링크 렌더링을 확인한다. 실제 Notion 연동 확인에는 `.env.local` 설정이 필요하다.

## `src/components/Comments.tsx`

`@giscus/react`로 GitHub Discussions 기반 댓글을 붙임(서버·DB 불필요, 콘텐츠는 GitHub가 호스팅). giscus는 자체 `<iframe>`이라 클라이언트 컴포넌트(`"use client"`)이고 서버에서 그릴 게 없음.

다크모드 동기화가 까다로운 지점: `ThemeToggle.tsx`는 커스텀 이벤트를 안 쏘고 그냥 `document.documentElement`의 `class`만 토글하므로(`NotionPage.tsx`가 다크모드를 처리하는 방식과 동일한 전제), 테마 전환을 실시간으로 반영하려면 `MutationObserver`로 그 class 변화를 직접 관찰해야 한다. `theme` prop이 바뀌면 `@giscus/react`가 알아서 iframe에 `postMessage`로 테마 변경을 전달해줘서, 우리가 iframe을 직접 리로드할 필요는 없음.

giscus는 레포 쪽 설정(Discussions 활성화, giscus 앱 설치, Discussions에 댓글용 카테고리 생성 후 `.env.local`의 `NEXT_PUBLIC_GISCUS_*` 4개 값 채우기)이 코드와 별개로 필요한데, 다 끝내고 동작 확인함(2026-08-06). 이 값들은 giscus 위젯 자체가 페이지 data-attribute로 그대로 노출하는 값이라 비밀이 아니라서 `NEXT_PUBLIC_` 접두사로 뒀다. 카테고리는 방문자가 새 토론을 못 만들게 Announcement 타입("Comments")으로 만들어뒀다 — giscus가 `mapping="pathname"` 기준으로 포스트별 스레드를 알아서 만듦.

## `src/app/page.tsx`

`?page=` 쿼리로 홈 목록을 페이지네이션함(`getPublishedPostsPage`, 페이지당 `POSTS_PAGE_SIZE`=10). `PostList.tsx`는 카드 렌더링 부분(`PostListView({ posts })`)만 export하는 순수 프레젠테이션 컴포넌트로 정리됨 — 데이터를 직접 가져오던 기본 export(`PostList`)는 홈/카테고리 페이지 둘 다 자기가 필요한 방식대로 fetch해야 해서(홈은 커서식 페이지네이션, 카테고리는 전체 조회 후 자르기) 제거함.

## `src/app/not-found.tsx`

커스텀 404 페이지. **이거 없으면 안 됨**: Next.js 기본 404는 `prefers-color-scheme`(OS 설정) 기준으로 자체 스타일을 강제 적용해서, 우리 앱의 다크모드 토글(class 기반)과 충돌해 배경색이 깨지는 버그가 있었음 (커스텀 404로 해결됨).

## `src/lib/mock.ts`

파일은 삭제되어 현재 존재하지 않는다. 글·카테고리는 Notion으로, 방문자 통계는 .NET + PostgreSQL 연동으로 대체했다.

## `src/app/sitemap.ts`, `src/app/robots.ts`

Next.js App Router의 특수 파일(`sitemap()`/`robots()` export)로 `/sitemap.xml`, `/robots.txt`를 만듦. 둘 다 `NEXT_PUBLIC_SITE_URL`(없으면 `http://localhost:3000`)을 기준으로 절대경로를 만듦. sitemap은 `getCategories()`가 반환하는 재귀 트리를 평탄화(`flattenCategoryNames`)해서 카테고리 URL도 전부 포함시킴.

## `.env.local`

git 미포함, 사용자가 직접 생성. `NOTION_TOKEN`, `NOTION_DATABASE_ID`(글), `NOTION_CATEGORY_DATABASE_ID`(카테고리) 필요, 도메인 정해지면 `NEXT_PUBLIC_SITE_URL`도. 예시는 `.env.local.example` 참고.

## `src/app/globals.css`

- `html body`, `html:root`처럼 일부러 selector를 두 개 결합해 specificity를 높인 규칙들이 있음 — 서드파티 라이브러리가 전역 `body`/`:root` 스타일(색상 등)을 깔아서 우리 테마를 덮어써버리는 문제를 겪은 뒤 넣은 방어 패턴. 새 서드파티 CSS를 붙일 때 비슷한 충돌이 생기면 같은 방식(더 구체적인 selector)을 쓸 것 — 다만 **동일한 specificity의 단일 클래스 선택자끼리는 나중에 로드되는 쪽(react-notion-x)이 이겨버리므로**(`.notion-collection-page-properties`, `.notion-table-of-contents`를 숨길 때 겪음), 부모 클래스를 하나 더 붙여서(`.notion .xxx`) specificity 자체를 올려야 확실히 이김.
- `--notion-max-width`(react-notion-x 변수, 기본 720px 고정폭)를 `100%`로 오버라이드해둠 — 본문 옆에 목차를 추가한 뒤로 가운데 칼럼이 720px보다 좁아지는 상황이 생겨서, 고정폭 때문에 본문이 넘쳐 우측 패널까지 밀어내는 문제가 있었음.
- 색상: 라이트 모드 텍스트 `#475570` 톤 유지 (사용자 지정), 다크 모드는 Claude가 같은 계열로 임의 조정함 — 필요시 재조정 가능.
