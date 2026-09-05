/** Safe markdown-ish formatting for Concierge replies. */

export function stripMarkdown(text) {
  return String(text || "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function safeHref(href) {
  const value = String(href || "").trim();
  if (!value) return null;
  if (value.startsWith("#")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:/i.test(value)) return value;
  return null;
}

/** Turn inline `* **Title**:` dumps into real list lines. */
export function normalizeReplyText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+\*\s+\*\*/g, "\n* **")
    .replace(/\s+-\s+\*\*/g, "\n- **")
    .replace(/\s+•\s+/g, "\n- ")
    .trim();
}

export function parseReplyBlocks(text) {
  const lines = normalizeReplyText(text).split("\n");
  const blocks = [];
  let para = [];
  let list = [];

  const flushPara = () => {
    if (!para.length) return;
    blocks.push({ type: "p", text: para.join(" ").replace(/\s+/g, " ").trim() });
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push({ type: "ul", items: list });
    list = [];
  };

  for (const line of lines) {
    const bullet = line.match(/^\s*(?:[-•]|\*)\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[1]);
    } else if (numbered) {
      flushPara();
      list.push(numbered[1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks.filter((block) =>
    block.type === "ul" ? block.items.length : Boolean(block.text)
  );
}
