// Domain types shared by the data layer, API routes, and pages.

/** An article transition within a text on a given day. */
export interface ArticleRef {
  legiarti: string;
  title: string; // e.g. "Article 45"
}

/** The act that produced an entered version (the amending JO text). */
export interface ActRef {
  cid: string; // JORFTEXT… (or LEGITEXT…)
  label: string;
  /** Rebuilt publication URL when the cid is a JORFTEXT. */
  jorfUrl: string | null;
}

/** One `Text:` record in a day's commit message. */
export interface TextChange {
  legitext: string;
  name: string;
  entered: ArticleRef[];
  left: ArticleRef[];
  acts: ActRef[];
  signers: string[]; // [] when "—"
}

/** A parsed daily commit message. */
export interface DayChangeset {
  date: string; // YYYY-MM-DD (from the header)
  records: TextChange[];
  coauthors: { name: string; email: string }[];
}

/** A history row (one tag / day). */
export interface HistoryEntry {
  tag: string; // YYYY-MM-DD
  date: string; // committedDate ISO
  sha: string;
  message: string; // raw commit message
  summary: {
    texts: number;
    in: number;
    out: number;
    acts: number;
    signers: number;
  };
}

export interface HistoryPage {
  entries: HistoryEntry[];
  nextCursor: string | null;
}

/** A file entry in a diff (commit or compare). */
export interface DiffFile {
  filename: string;
  status: string; // added | modified | removed | renamed …
  additions: number;
  deletions: number;
  patch?: string; // unified diff (absent for huge/binary files)
  previousFilename?: string;
}

export interface CommitDetail {
  tag: string;
  sha: string;
  parentSha: string | null;
  changeset: DayChangeset;
  files: DiffFile[];
  truncated: boolean; // GitHub caps files at 300
  totalFiles: number;
}

export interface CompareResult {
  base: string;
  head: string;
  aheadBy: number;
  behindBy: number;
  files: DiffFile[];
  truncated: boolean;
}

/** A contiguous blame range. */
export interface BlameRange {
  startingLine: number;
  endingLine: number;
  sha: string;
  abbreviatedSha: string;
  committedDate: string;
  messageHeadline: string;
  author: string;
}

/** A tree entry when browsing. */
export interface TreeEntry {
  name: string;
  path: string;
  type: "dir" | "file";
  size: number;
  sha: string;
}
