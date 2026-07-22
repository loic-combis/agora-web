"use client";

import { useState } from "react";
import { DiffFileView } from "@/components/diff-file";
import { Button } from "@/components/ui/button";
import type { CommitDetail, DiffFile } from "@/lib/types";

/**
 * Renders the initial (server-fetched) diff files, then lazy-loads further pages
 * on demand via `/api/tags/[tag]?page=` — needed for the seed day (~13k files).
 */
export function DiffLoader({
  tag,
  initialFiles,
  initialTruncated,
}: {
  tag: string;
  initialFiles: DiffFile[];
  initialTruncated: boolean;
}) {
  const [files, setFiles] = useState<DiffFile[]>(initialFiles);
  const [page, setPage] = useState(1);
  const [truncated, setTruncated] = useState(initialTruncated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tags/${encodeURIComponent(tag)}?page=${page + 1}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CommitDetail = await res.json();
      setFiles((f) => [...f, ...data.files]);
      setPage((p) => p + 1);
      setTruncated(data.truncated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {files.map((file, i) => (
        <DiffFileView key={`${file.filename}-${i}`} file={file} />
      ))}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {truncated && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Chargement…" : `Charger plus de fichiers (${files.length} affichés)`}
          </Button>
        </div>
      )}
    </div>
  );
}
