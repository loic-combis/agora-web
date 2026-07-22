// Parse a unified-diff patch (as returned by the GitHub commit/compare APIs) into
// typed lines with old/new line numbers, for a GitHub-style two-gutter renderer.

export type DiffLineType = "add" | "del" | "context" | "hunk";

export interface DiffLine {
  type: DiffLineType;
  content: string; // without the leading +/-/space marker
  oldNo: number | null;
  newNo: number | null;
}

const HUNK_RE = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parsePatch(patch: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldNo = 0;
  let newNo = 0;

  for (const raw of patch.split("\n")) {
    const hunk = HUNK_RE.exec(raw);
    if (hunk) {
      oldNo = Number(hunk[1]);
      newNo = Number(hunk[2]);
      lines.push({ type: "hunk", content: raw, oldNo: null, newNo: null });
      continue;
    }
    if (raw.startsWith("+")) {
      lines.push({ type: "add", content: raw.slice(1), oldNo: null, newNo: newNo++ });
    } else if (raw.startsWith("-")) {
      lines.push({ type: "del", content: raw.slice(1), oldNo: oldNo++, newNo: null });
    } else {
      // context (leading space) or the trailing "\ No newline" marker
      lines.push({
        type: "context",
        content: raw.startsWith(" ") ? raw.slice(1) : raw,
        oldNo: oldNo++,
        newNo: newNo++,
      });
    }
  }
  return lines;
}
