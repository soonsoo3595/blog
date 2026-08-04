import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function getAboutContent() {
  const filePath = path.join(process.cwd(), "src/content/about.md");
  return fs.readFileSync(filePath, "utf-8");
}

export default function About() {
  const about = getAboutContent();

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        About
      </p>
      <div
        className="text-sm leading-relaxed
          [&_p]:mb-2
          [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5
          [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5
          [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:font-semibold
          [&_code]:rounded [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs
          [&_table]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs
          [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left
          [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{about}</ReactMarkdown>
      </div>
    </div>
  );
}
