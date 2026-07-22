import type { Metadata } from "next";
import { CompareClient } from "@/components/compare-client";
import { listTagNames } from "@/lib/github";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Comparer deux versions",
  description:
    "Comparez le droit français applicable entre deux dates : différences fichier par fichier et blame ligne par ligne.",
};

async function loadTags(): Promise<string[]> {
  try {
    return await listTagNames(100);
  } catch {
    return [];
  }
}

export default async function ComparePage() {
  const tags = await loadTags();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Comparer deux versions</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez deux dates pour voir les textes qui ont changé entre elles.
        </p>
      </div>
      {tags.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucune version disponible. Vérifiez que <code>GITHUB_TOKEN</code> est configuré.
        </p>
      ) : (
        <CompareClient tags={tags} />
      )}
    </div>
  );
}
