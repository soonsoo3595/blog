import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  basePath: string;
} & (
  | { totalPages: number; hasNextPage?: undefined }
  | { totalPages?: undefined; hasNextPage: boolean }
);

// totalPages를 알면(카테고리 페이지처럼 전체를 이미 가져온 경우) 번호를 전부
// 보여주고, 모르면(홈 목록처럼 커서 기반으로 필요한 만큼만 가져온 경우)
// hasNextPage로 "다음" 버튼 노출 여부만 판단한다.
export default function Pagination(props: PaginationProps) {
  const { currentPage, basePath } = props;
  const hasNext =
    props.totalPages !== undefined
      ? currentPage < props.totalPages
      : props.hasNextPage;
  const hasPrev = currentPage > 1;

  if (!hasNext && !hasPrev) {
    return null;
  }

  const pageHref = (page: number) =>
    page === 1 ? basePath : `${basePath}?page=${page}`;

  return (
    <nav className="flex items-center justify-center gap-4 text-sm">
      {hasPrev ? (
        <Link href={pageHref(currentPage - 1)} className="hover:text-accent">
          이전
        </Link>
      ) : (
        <span className="text-foreground/30">이전</span>
      )}

      {props.totalPages !== undefined ? (
        <div className="flex items-center gap-1">
          {Array.from({ length: props.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <Link
                key={page}
                href={pageHref(page)}
                className={`rounded-md px-2 py-1 ${
                  page === currentPage
                    ? "bg-panel font-semibold"
                    : "hover:bg-panel"
                }`}
              >
                {page}
              </Link>
            ),
          )}
        </div>
      ) : (
        <span>{currentPage}</span>
      )}

      {hasNext ? (
        <Link href={pageHref(currentPage + 1)} className="hover:text-accent">
          다음
        </Link>
      ) : (
        <span className="text-foreground/30">다음</span>
      )}
    </nav>
  );
}
