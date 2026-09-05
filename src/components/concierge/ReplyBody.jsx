import { parseReplyBlocks, safeHref } from "../../lib/formatReply";

function Inline({ text, k }) {
  const src = String(text || "");
  const parts = [];
  const re = /(\*\*[^*]+?\*\*|`[^`]+?`|\[[^\]]+?\]\([^)]+?\))/g;
  let last = 0;
  let i = 0;
  let match;

  while ((match = re.exec(src))) {
    if (match.index > last) {
      parts.push(src.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${k}-b${i}`}>{token.slice(2, -2)}</strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(<code key={`${k}-c${i}`}>{token.slice(1, -1)}</code>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link ? safeHref(link[2]) : null;
      if (href) {
        const external = !href.startsWith("#");
        parts.push(
          <a
            key={`${k}-a${i}`}
            href={href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {link[1]}
          </a>
        );
      } else {
        parts.push(link ? link[1] : token);
      }
    }
    i += 1;
    last = match.index + token.length;
  }
  if (last < src.length) parts.push(src.slice(last));
  return parts;
}

export default function ReplyBody({ text }) {
  const blocks = parseReplyBlocks(text);
  if (!blocks.length) return <p>{text}</p>;

  return (
    <div className="concierge-rich">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={`l${i}`}>
            {block.items.map((item, j) => (
              <li key={`i${i}-${j}`}>
                <Inline text={item} k={`${i}-${j}`} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={`p${i}`}>
            <Inline text={block.text} k={`p${i}`} />
          </p>
        )
      )}
    </div>
  );
}
