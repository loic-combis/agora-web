import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangesetView } from "@/components/changeset-view";
import { DiffLoader } from "@/components/diff-loader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { getDay } from "@/lib/github";
import type { CommitDetail } from "@/lib/types";

export const revalidate = 86400; // REVALIDATE.immutable

// Render tag pages on-demand (ISR), not at build time: prerendering all 45 at
// once hammers the GitHub API into rate-limit backoff. Pages are still SSR'd and
// indexable — generated on first request, then cached per `revalidate`.
export async function generateStaticParams() {
  return [];
}

async function load(tag: string): Promise<CommitDetail | null> {
  try {
    return await getDay(tag);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `Version du ${formatDate(tag)}`,
    description: `Changements du droit français applicable au ${formatDate(tag)} : textes modifiés, articles entrés et sortis de vigueur.`,
  };
}

export default async function TagDetailPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const detail = await load(tag);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{formatDate(tag)}</h1>
          <p className="font-mono text-xs text-muted-foreground">
            {tag} · {detail.sha.slice(0, 10)}
          </p>
        </div>
        <Button
          render={<Link href={`/browse/${tag}`} />}
          variant="outline"
          size="sm"
        >
          Parcourir cette version →
        </Button>
      </div>

      <Tabs defaultValue="changes">
        <TabsList>
          <TabsTrigger value="changes">Changements</TabsTrigger>
          <TabsTrigger value="diff">Différences</TabsTrigger>
        </TabsList>
        <TabsContent value="changes" className="pt-4">
          <ChangesetView changeset={detail.changeset} />
        </TabsContent>
        <TabsContent value="diff" className="pt-4">
          {detail.files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun fichier modifié.</p>
          ) : (
            <DiffLoader
              tag={tag}
              initialFiles={detail.files}
              initialTruncated={detail.truncated}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
