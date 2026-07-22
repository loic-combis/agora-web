// The data-access layer over the `agora-france` GitHub repo. These functions are
// imported directly by Server Components (for SSR) and wrapped by the route
// handlers (for client interactivity) — the single source of truth for GitHub I/O.
import { Octokit } from "octokit";
import { parseCommitMessage, summarize } from "./parse-commit";
import type {
  BlameRange,
  CommitDetail,
  CompareResult,
  DiffFile,
  HistoryEntry,
  HistoryPage,
  TreeEntry,
} from "./types";

export const OWNER = process.env.AGORA_REPO_OWNER ?? "loic-combis";
export const REPO = process.env.AGORA_REPO_NAME ?? "agora-france";

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
    const commit = commitOf(node.target);
    if (!commit) continue;
    entries.push({
      tag: node.name,
      date: commit.committedDate,
      sha: commit.oid,
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
