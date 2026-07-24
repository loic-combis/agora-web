// The data-access layer over the `agora-france` GitHub repo. These functions are
// imported directly by Server Components (for SSR) and wrapped by the route
// handlers (for client interactivity) — the single source of truth for GitHub I/O.
import { Octokit } from "octokit";
import { parseCommitMessage, summarize } from "./parse-commit";
import { humanizeSlug, personEmail } from "./slug";
import type {
  BlameRange,
  CommitDetail,
  CompareResult,
  DiffFile,
  HistoryEntry,
  HistoryPage,
  TextChange,
  TreeEntry,
} from "./types";

/** One day this text changed: the tag date, the commit sha, its parsed record. */
export interface TextHistoryEntry {
  date: string;
  sha: string;
  record: TextChange;
}

export const OWNER = process.env.AGORA_REPO_OWNER ?? "loic-combis";
export const REPO = process.env.AGORA_REPO_NAME ?? "agora-france";

/** The genesis day (first ingested date). Its diff vs the empty INIT repo is the
 *  whole corpus (~13k files) being created at once — not a real legislative change.
 *  We hide it from the history feed and refuse its diff, so the UI never surfaces
 *  that big-bang changeset. */
export const GENESIS_TAG = "1970-01-01";

let client: Octokit | null = null;
/** Lazily-built singleton. Works unauthenticated for REST (60/hr); a PAT lifts
 *  the limit to 5000/hr and is required for GraphQL (tag listing + blame). */
export function octokit(): Octokit {
  if (!client) client = new Octokit({ auth: process.env.GITHUB_TOKEN });
  return client;
}

export function hasToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

// --- GraphQL shapes -------------------------------------------------------

interface CommitNode {
  oid: string;
  committedDate: string;
  message: string;
}
interface RefNode {
  name: string;
  target:
    | (CommitNode & { __typename: "Commit" })
    | { __typename: "Tag"; target: CommitNode }
    | { __typename: string };
}

function commitOf(target: RefNode["target"]): CommitNode | null {
  if (!target || typeof target !== "object") return null;
  if ("oid" in target && "message" in target) return target as CommitNode;
  if ("target" in target && target.target) return target.target as CommitNode;
  return null;
}

// --- Tag list / history ---------------------------------------------------

/** List tags (newest commit first) with a parsed summary of each day's changes. */
export async function listTags(limit = 50, cursor?: string): Promise<HistoryPage> {
  const data = await octokit().graphql<{
    repository: {
      refs: {
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
        nodes: RefNode[];
      };
    };
  }>(
    `query($owner:String!,$repo:String!,$first:Int!,$after:String){
      repository(owner:$owner,name:$repo){
        refs(refPrefix:"refs/tags/",first:$first,after:$after,
             orderBy:{field:TAG_COMMIT_DATE,direction:DESC}){
          pageInfo{ endCursor hasNextPage }
          nodes{
            name
            target{
              __typename
              ... on Commit { oid committedDate message }
              ... on Tag { target{ ... on Commit { oid committedDate message } } }
            }
          }
        }
      }
    }`,
    { owner: OWNER, repo: REPO, first: limit, after: cursor ?? null },
  );

  const refs = data.repository.refs;
  const entries: HistoryEntry[] = [];
  for (const node of refs.nodes) {
    if (node.name === GENESIS_TAG) continue; // never surface the big-bang seed day
    const commit = commitOf(node.target);
    if (!commit) continue;
    entries.push({
      tag: node.name,
      date: commit.committedDate,
      sha: commit.oid,
      message: commit.message,
      summary: summarize(parseCommitMessage(commit.message)),
    });
  }
  return {
    entries,
    nextCursor: refs.pageInfo.hasNextPage ? refs.pageInfo.endCursor : null,
  };
}

/** Just the tag names, newest first — for `generateStaticParams`. */
export async function listTagNames(limit = 100): Promise<string[]> {
  const { entries } = await listTags(limit);
  return entries.map((e) => e.tag);
}

/**
 * A text's version timeline (newest first): every day it changed. Found by
 * searching commit messages for the LEGITEXT id — each day's message carries a
 * `Text: <legitext> | …` block — then keeping the record for this text. Each entry
 * links to that day's per-text diff (`/compare/:date/:text`).
 */
export async function listTextHistory(
  legitext: string,
): Promise<TextHistoryEntry[]> {
  const res = await octokit().rest.search.commits({
    q: `repo:${OWNER}/${REPO} "${legitext}"`,
    sort: "committer-date",
    order: "desc",
    per_page: 100,
  });
  const out: TextHistoryEntry[] = [];
  for (const item of res.data.items) {
    const cs = parseCommitMessage(item.commit.message);
    const record = cs.records.find((r) => r.legitext === legitext);
    if (record) out.push({ date: cs.date, sha: item.sha, record });
  }
  return out;
}

// --- Persons --------------------------------------------------------------

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Best readable (accented) name for a signatory slug. The slug is ASCII-lossy, so
 * we recover the true name from the commit metadata the replay baked the slug into:
 * first as a commit *author* (the day's first signatory), then from a
 * `Co-authored-by` trailer (a co-signer). Falls back to a humanised slug when the
 * commit index has nothing (no token, search lag, or an unknown slug).
 */
export async function personDisplayName(slug: string): Promise<string> {
  const email = personEmail(slug);
  try {
    const byAuthor = await octokit().rest.search.commits({
      q: `repo:${OWNER}/${REPO} author-email:${email}`,
      per_page: 1,
    });
    const authorName = byAuthor.data.items[0]?.commit.author?.name?.trim();
    if (authorName) return authorName;

    const byTrailer = await octokit().rest.search.commits({
      q: `repo:${OWNER}/${REPO} "${email}"`,
      per_page: 1,
    });
    const message = byTrailer.data.items[0]?.commit.message ?? "";
    const m = new RegExp(
      `Co-authored-by:\\s*(.+?)\\s*<${escapeRe(email)}>`,
    ).exec(message);
    if (m?.[1]) return m[1].trim();
  } catch {
    // Unauthenticated rate limits / unindexed commits: fall back below.
  }
  return humanizeSlug(slug);
}

// --- Commit detail + diff -------------------------------------------------

function mapFile(f: {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  previous_filename?: string;
}): DiffFile {
  return {
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch,
    previousFilename: f.previous_filename,
  };
}

function hasNextPage(link?: string): boolean {
  return /rel="next"/.test(link ?? "");
}

/**
 * A tag's day: the parsed commit message plus the diff vs its first parent.
 * The diff is paginated (GitHub caps a commit's files at 300) — the seed day
 * has ~13k files, so pages lazy-load further pages via the API route.
 */
export async function getDay(tag: string, page = 1, perPage = 100): Promise<CommitDetail> {
  if (tag === GENESIS_TAG) {
    // Fail closed: the genesis diff is the entire seeded corpus, not browsable here.
    throw new Error(`No diff available for the genesis day ${GENESIS_TAG}.`);
  }
  const res = await octokit().rest.repos.getCommit({
    owner: OWNER,
    repo: REPO,
    ref: tag,
    page,
    per_page: perPage,
  });
  const c = res.data;
  const files = (c.files ?? []).map(mapFile);
  return {
    tag,
    sha: c.sha,
    parentSha: c.parents[0]?.sha ?? null,
    changeset: parseCommitMessage(c.commit.message),
    files,
    truncated: hasNextPage(res.headers.link),
    totalFiles: c.files?.length ?? 0,
  };
}

// --- Compare two versions -------------------------------------------------

export async function compare(
  base: string,
  head: string,
  page = 1,
  perPage = 100,
): Promise<CompareResult> {
  const res = await octokit().rest.repos.compareCommitsWithBasehead({
    owner: OWNER,
    repo: REPO,
    basehead: `${base}...${head}`,
    page,
    per_page: perPage,
  });
  const d = res.data;
  return {
    base,
    head,
    aheadBy: d.ahead_by,
    behindBy: d.behind_by,
    files: (d.files ?? []).map(mapFile),
    truncated: hasNextPage(res.headers.link),
  };
}

// --- Blame ----------------------------------------------------------------

export async function blame(tag: string, path: string): Promise<BlameRange[]> {
  const data = await octokit().graphql<{
    repository: {
      ref: {
        target: {
          blame: {
            ranges: {
              startingLine: number;
              endingLine: number;
              commit: {
                oid: string;
                abbreviatedOid: string;
                committedDate: string;
                messageHeadline: string;
                author: { name: string | null } | null;
              };
            }[];
          };
        } | null;
      } | null;
    };
  }>(
    `query($owner:String!,$repo:String!,$ref:String!,$path:String!){
      repository(owner:$owner,name:$repo){
        ref(qualifiedName:$ref){
          target{
            ... on Commit {
              blame(path:$path){
                ranges{
                  startingLine endingLine
                  commit{ oid abbreviatedOid committedDate messageHeadline author{ name } }
                }
              }
            }
          }
        }
      }
    }`,
    { owner: OWNER, repo: REPO, ref: `refs/tags/${tag}`, path },
  );

  const ranges = data.repository.ref?.target?.blame.ranges ?? [];
  return ranges.map((r) => ({
    startingLine: r.startingLine,
    endingLine: r.endingLine,
    sha: r.commit.oid,
    abbreviatedSha: r.commit.abbreviatedOid,
    committedDate: r.commit.committedDate,
    messageHeadline: r.commit.messageHeadline,
    author: r.commit.author?.name ?? "—",
  }));
}

// --- Browse: tree + content ----------------------------------------------

/** List a directory at a tag. `path=""` returns the category roots. */
export async function tree(tag: string, path = ""): Promise<TreeEntry[]> {
  const res = await octokit().rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    ref: tag,
  });
  if (!Array.isArray(res.data)) {
    throw new Error(`Not a directory: ${path}`);
  }
  return res.data
    .map((e) => ({
      name: e.name,
      path: e.path,
      type: e.type === "dir" ? ("dir" as const) : ("file" as const),
      size: e.size,
      sha: e.sha,
    }))
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name, "fr") : a.type === "dir" ? -1 : 1,
    );
}

/** Raw Markdown of a file at a tag. */
export async function content(tag: string, path: string): Promise<string> {
  const res = await octokit().rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    ref: tag,
    mediaType: { format: "raw" },
  });
  // With `format: "raw"` Octokit returns the file body as a string.
  return res.data as unknown as string;
}
