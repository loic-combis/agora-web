import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Folder } from "lucide-react";
import { ArticleView } from "@/components/article-view";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { categoryLabel, formatDate, prettyName } from "@/lib/format";
import { content, tree } from "@/lib/github";
import { parseArticleMarkdown } from "@/lib/parse-article-md";
import type { TreeEntry } from "@/lib/types";

export const revalidate = 86400; // REVALIDATE.immutable

export async function generateStaticParams() {
  return []; // rendered on demand, then ISR-cached
}

function href(tag: string, segments: string[]): string {
  const encoded = segments.map(encodeURIComponent).join("/");
  return encoded ? `/browse/${tag}/${encoded}` : `/browse/${tag}`;
}

/** Decode a route segment; tolerant of already-decoded values and bad escapes. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function isFile(segments: string[]): boolean {
  return segments.at(-1)?.endsWith(".md") ?? false;
}

export async function generateMetadata({
  params,
}: PageProps<"/browse/[tag]/[[...path]]">): Promise<Metadata> {
  const { tag, path = [] } = await params;
  const last = path.at(-1);
  const where = last ? prettyName(decodeSegment(last)) : "toutes les catégories";
  return {
    title: `${where} — ${formatDate(tag)}`,
    description: `Contenu du droit français applicable au ${formatDate(tag)} : ${where}.`,
  };
}

function label(segment: string, depth: number): string {
  return depth === 0 ? categoryLabel(segment) : prettyName(segment);
}

function Crumbs({ tag, path }: { tag: string; path: string[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={href(tag, [])} />}>
            {formatDate(tag)}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {path.map((seg, i) => {
          const isLast = i === path.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label(seg, i)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href(tag, path.slice(0, i + 1))} />}>
                    {label(seg, i)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DirListing({ tag, entries, depth }: { tag: string; entries: TreeEntry[]; depth: number }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Dossier vide.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border">
      {entries.map((entry) => {
        const isDir = entry.type === "dir";
        const name = isDir ? label(entry.name, depth) : prettyName(entry.name);
        return (
          <li key={entry.path}>
            <Link
              href={`/browse/${tag}/${entry.path.split("/").map(encodeURIComponent).join("/")}`}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
            >
              {isDir ? (
                <Folder className="size-4 text-muted-foreground" />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <span className="flex-1">{name}</span>
              {!isDir && (
                <span className="font-mono text-xs text-muted-foreground">
                  {(entry.size / 1024).toFixed(1)} Ko
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function BrowsePage({ params }: PageProps<"/browse/[tag]/[[...path]]">) {
  const { tag, path: rawPath = [] } = await params;
  // Next.js hands back the raw (still percent-encoded) catch-all segments, so we
  // decode them before hitting GitHub — otherwise Octokit re-encodes the `%` and
  // GitHub 404s on the double-encoded path.
  const path = rawPath.map(decodeSegment);
  const joined = path.join("/");

  if (isFile(path)) {
    let markdown: string;
    try {
      markdown = await content(tag, joined);
    } catch {
      notFound();
    }
    const doc = parseArticleMarkdown(markdown!);
    return (
      <div className="space-y-6">
        <Crumbs tag={tag} path={path} />
        <ArticleView doc={doc} />
      </div>
    );
  }

  let entries: TreeEntry[];
  try {
    entries = await tree(tag, joined);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Crumbs tag={tag} path={path} />
      <DirListing tag={tag} entries={entries!} depth={path.length} />
    </div>
  );
}
