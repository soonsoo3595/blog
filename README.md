# 뎁밥

개발과 일상을 기록하는 개인 블로그. Notion에서 글을 작성하고, Next.js 블로그는 공개 글을 읽기 전용으로 보여준다.

## 구성과 연동 서비스

| 영역 | 현재 구현 |
|---|---|
| 화면 | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| 콘텐츠 | Notion 글 DB + 카테고리 DB. 공식 API로 목록·속성 조회, notion-client로 본문 조회, react-notion-x로 렌더링 |
| 검색 | Meilisearch에 글 제목·본문·카테고리 인덱싱 |
| 댓글·리액션 | giscus / GitHub Discussions |
| 프로필 | GitHub 공개 사용자 API |
| 조회수·방문자 | Next.js API → .NET 9 API → PostgreSQL (EF Core + Npgsql) |

Redis는 초기 계획에 있었지만 현재 저장소에 연동 코드는 없다. Umami·Plausible 분석도 미도입이다.

## 로컬 개발

Node.js와 .NET 9 SDK가 필요하다. 프론트엔드 Docker 이미지는 Node.js 22를 사용한다.

1. `npm ci`로 의존성을 설치한다.
2. `.env.local.example`을 `.env.local`로 복사하고 연결 값을 채운다.
3. 백엔드 DB 연결 문자열 `ConnectionStrings:Default`를 `backend/`에서 `dotnet user-secrets` 등으로 설정한다. 연결 문자열은 커밋하지 않는다.
4. 홈서버 PostgreSQL·Meilisearch를 사용한다면 SSH 설정 후 터널을 연다.

```bash
ssh -L 15432:localhost:15432 -L 17700:localhost:17700 homeserver
```

각각 별도 터미널에서 실행한다.

```bash
npm run dev
```

```bash
dotnet run --project backend/Blog.Api.csproj --launch-profile http
```

프론트엔드는 [localhost:3000](http://localhost:3000), 백엔드는 [localhost:5145](http://localhost:5145)에서 실행한다. 백엔드는 시작 시 DB 마이그레이션을 적용하므로 PostgreSQL 연결이 필요하다.

## 운영과 문서

- 검색 갱신은 `POST /api/search/reindex`에 `x-reindex-secret` 헤더를 전달한다. 자동 갱신은 아직 없다.
- Notion 목록·카테고리·퀴즈 목록은 1분, 본문은 5분 캐시 후 접근 시 백그라운드 갱신한다. 즉시 반영하려면 `POST /api/notion/revalidate`에 같은 비밀 헤더를 전달한다. 비공개 전환에도 갱신 전까지 지연이 있을 수 있다.
- 이 저장소는 프론트엔드·백엔드 Dockerfile을 제공한다. Compose·Traefik·Cloudflare Tunnel 설정은 별도 [homeserver-infra](https://github.com/soonsoo3595/homeserver-infra) 저장소에서 관리한다.
- `NEXT_PUBLIC_*`는 프론트엔드 빌드 시 포함되므로 운영 값으로 빌드해야 한다.
- [프로젝트 지침](CLAUDE.md), [구조 상세](docs/STRUCTURE.md), [남은 작업과 제약](docs/ISSUES.md)을 참고한다.

2026-10-18 저장소 코드 기준으로 정리했다. 과거 기록에는 `https://devbap.co.kr` 배포 완료가 기재돼 있으나, 이번 문서 정리에서 운영 서버의 현재 상태를 검증하지는 않았다.
