import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { listTags } from "@/lib/github";
import type { HistoryEntry } from "@/lib/types";

export const revalidate = 300; // REVALIDATE.history

async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const { entries } = await listTags(100);
    return entries;
  } catch {
    // Token-resilient: render an empty state rather than failing the build.
    return [];
  }
}

export default async function HistoryPage() {
  const entries = await loadHistory();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Historique du droit applicable</h1>
        <p className="text-sm text-muted-foreground">
          Chaque version correspond à une journée : les textes entrés en vigueur, modifiés ou
          abrogés ce jour-là. {entries.length} versions.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucune version disponible. Vérifiez que <code>GITHUB_TOKEN</code> est configuré.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Textes</TableHead>
                <TableHead className="text-right">Entrés</TableHead>
                <TableHead className="text-right">Sortis</TableHead>
                <TableHead className="text-right">Actes</TableHead>
                <TableHead className="text-right">Signataires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.tag}>
                  <TableCell className="font-medium">
                    <Link href={`/tags/${e.tag}`} className="block hover:underline">
                      {formatDate(e.tag)}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{e.tag}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{e.summary.texts}</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                    {e.summary.in}
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">
                    {e.summary.out}
                  </TableCell>
                  <TableCell className="text-right">{e.summary.acts}</TableCell>
                  <TableCell className="text-right">{e.summary.signers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
