import type { ActRef, ArticleRef, DayChangeset, TextChange } from "./types";

const DATE_RE = /^APPLICABLE LAW AS OF (\d{4}-\d{2}-\d{2})/;
const COAUTHOR_RE = /^Co-authored-by:\s*(.+?)\s*<([^>]+)>\s*$/;

/** Split an `<id> | <label>` value on the FIRST ` | ` (labels may contain more). */
function splitPipe(value: string): [string, string] {
  const i = value.indexOf(" | ");
  return i === -1 ? [value.trim(), ""] : [value.slice(0, i).trim(), value.slice(i + 3).trim()];
}

function actOf(cid: string, label: string): ActRef {
  return {
    cid,
    label,
    jorfUrl: cid.startsWith("JORFTEXT")
      ? `https://www.legifrance.gouv.fr/jorf/id/${cid}`
      : null,
  };
}

/**
 * Parse a day's `Key: value` commit message into a typed changeset.
 * The grammar is line-oriented so we scan line by line; `------` separators and
 * blank lines are ignored (records are delimited by their `Text:` line).
 */
export function parseCommitMessage(message: string): DayChangeset {
  const cs: DayChangeset = { date: "", records: [], coauthors: [] };
  let current: TextChange | null = null;

  for (const raw of message.split("\n")) {
    const line = raw.trimEnd();
    if (!line || line === "------") continue;

    const dateM = DATE_RE.exec(line);
    if (dateM) {
      cs.date = dateM[1];
      continue;
    }

    if (line.startsWith("Text: ")) {
      const [legitext, name] = splitPipe(line.slice(6));
      current = { legitext, name, entered: [], left: [], acts: [], signers: [] };
      cs.records.push(current);
      continue;
    }
    if (line.startsWith("In: ") && current) {
      const [legiarti, title] = splitPipe(line.slice(4));
      current.entered.push({ legiarti, title });
      continue;
    }
    if (line.startsWith("Out: ") && current) {
      const [legiarti, title] = splitPipe(line.slice(5));
      current.left.push({ legiarti, title });
      continue;
    }
    if (line.startsWith("Act: ") && current) {
      const [cid, label] = splitPipe(line.slice(5));
      current.acts.push(actOf(cid, label));
      continue;
    }
    if (line.startsWith("Signed-by: ") && current) {
      const value = line.slice(11).trim();
      current.signers = value === "—" || value === "" ? [] : value.split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    const co = COAUTHOR_RE.exec(line);
    if (co) cs.coauthors.push({ name: co[1], email: co[2] });
  }

  return cs;
}

/**
 * Split a record's article transitions into three buckets: articles that only
 * entered (added), only left (removed), and those present on both sides — i.e.
 * edited.
 *
 * Keyed on `title` (the article number, e.g. "Article 45"), NOT `legiarti`:
 * Légifrance versions are per-`legiarti`, so editing an article closes its old
 * version and opens a new one with a fresh `legiarti`. The same article thus
 * appears in `left` (old version) and `entered` (new version) with the same
 * title but different ids. The edited entry links to the new (entered) version.
 */
export function partitionArticles(record: TextChange): {
  entered: ArticleRef[];
  left: ArticleRef[];
  edited: ArticleRef[];
} {
  const leftTitles = new Set(record.left.map((a) => a.title));
  const enteredTitles = new Set(record.entered.map((a) => a.title));
  return {
    entered: record.entered.filter((a) => !leftTitles.has(a.title)),
    left: record.left.filter((a) => !enteredTitles.has(a.title)),
    edited: record.entered.filter((a) => leftTitles.has(a.title)),
  };
}

/** Compact counts for the history table. */
export function summarize(cs: DayChangeset) {
  let inC = 0;
  let outC = 0;
  let acts = 0;
  const signers = new Set<string>();
  for (const r of cs.records) {
    inC += r.entered.length;
    outC += r.left.length;
    acts += r.acts.length;
    r.signers.forEach((s) => signers.add(s));
  }
  return { texts: cs.records.length, in: inC, out: outC, acts, signers: signers.size };
}
