"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import type { BlameRange } from "@/lib/types";

interface Loaded {
  lines: string[];
  ranges: BlameRange[];
}

/** For a file at a tag, pair each source line with the commit that last touched
 *  it (git blame), rendered as a left gutter. Fetches content + blame client-side. */
export function BlameView({ tag, path }: { tag: string; path: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    (async () => {
      try {
        const q = `ref=${encodeURIComponent(tag)}&path=${encodeURIComponent(path)}`;
        const [cRes, bRes] = await Promise.all([
          fetch(`/api/content?${q}`),
          fetch(`/api/blame?${q}`),
        ]);
        if (!cRes.ok || !bRes.ok) throw new Error("Chargement impossible");
        const { markdown } = await cRes.json();
        const ranges: BlameRange[] = await bRes.json();
        if (!cancelled) setData({ lines: markdown.split("\n"), ranges });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tag, path]);

  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Chargement du blame…</p>;

  const rangeFor = (lineNo: number) =>
    data.ranges.find((r) => lineNo >= r.startingLine && lineNo <= r.endingLine);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse font-mono text-xs">
        <tbody>
          {data.lines.map((line, i) => {
            const lineNo = i + 1;
            const r = rangeFor(lineNo);
            const isStart = r?.startingLine === lineNo;
            return (
              <tr key={i} className="align-top">
                <td
                  className="w-56 border-r bg-muted/40 px-2 py-0.5 whitespace-nowrap text-muted-foreground"
                  title={r ? `${r.author} · ${r.messageHeadline}` : ""}
                >
                  {isStart && r && (
                    <span className="flex gap-2">
                      <span className="text-primary">{r.abbreviatedSha}</span>
                      <span className="truncate">{formatDate(r.committedDate)}</span>
                    </span>
                  )}
                </td>
                <td className="w-10 border-r px-2 py-0.5 text-right text-muted-foreground select-none">
                  {lineNo}
                </td>
                <td className="py-0.5 pl-3 whitespace-pre-wrap break-all">{line}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
