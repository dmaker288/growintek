import { Fragment } from "react";
function blocks(content: string) {
  const result: {
    kind: "h2" | "h3" | "list" | "paragraph";
    text: string;
    id?: string;
  }[] = [];
  let lines: string[] = [];
  const flush = () => {
    if (lines.length) {
      result.push({
        kind: lines.every((l) => l.startsWith("- ")) ? "list" : "paragraph",
        text: lines.join("\n"),
      });
      lines = [];
    }
  };
  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) {
      flush();
      result.push({
        kind: heading[1].length === 2 ? "h2" : "h3",
        text: heading[2],
        id: `section-${result.length}-${heading[2]
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,
      });
    } else if (!line.trim()) flush();
    else {
      if (lines.length && line.startsWith("- ") !== lines[0].startsWith("- "))
        flush();
      lines.push(line);
    }
  }
  flush();
  return result;
}
export function articleHeadings(content: string) {
  return blocks(content)
    .filter((b) => b.kind === "h2" || b.kind === "h3")
    .map((b) => ({ title: b.text, level: b.kind === "h2" ? 2 : 3, id: b.id! }));
}
function inline(text: string) {
  return text
    .split(
      /(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^\s)]+\)|\[[^\]]+\]\(\/[a-zA-Z0-9/_-]*\))/g,
    )
    .map((part, i) => {
      if (part.startsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link)
        return (
          <a
            key={i}
            href={link[2]}
            rel={link[2].startsWith("https:") ? "noreferrer" : undefined}
          >
            {link[1]}
          </a>
        );
      return <Fragment key={i}>{part}</Fragment>;
    });
}
export default function Markdown({ content }: { content: string }) {
  return (
    <div className="prose">
      {blocks(content).map((block, i) => {
        if (block.kind === "h2")
          return (
            <h2 id={block.id} key={i}>
              {inline(block.text)}
            </h2>
          );
        if (block.kind === "h3")
          return (
            <h3 id={block.id} key={i}>
              {inline(block.text)}
            </h3>
          );
        if (block.kind === "list")
          return (
            <ul key={i}>
              {block.text.split("\n").map((line, j) => (
                <li key={j}>{inline(line.slice(2))}</li>
              ))}
            </ul>
          );
        return <p key={i}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
