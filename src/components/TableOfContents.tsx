import { uuidToId, type TableOfContentsEntry } from "notion-utils";

export default function TableOfContents({
  items,
}: {
  items: TableOfContentsEntry[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="hidden w-full flex-col gap-1 text-sm lg:flex">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        목차
      </p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${uuidToId(item.id)}`}
          className="truncate text-foreground/70 hover:text-foreground"
          style={{ paddingLeft: `${item.indentLevel * 12}px` }}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
