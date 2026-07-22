"use client";

import { useState } from "react";
import { BlameView } from "@/components/blame-view";
import { DiffFileView } from "@/components/diff-file";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import type { CompareResult } from "@/lib/types";

function TagSelect({
  value,
  onChange,
  tags,
}: {
  value: string;
  onChange: (v: string) => void;
  tags: string[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {tags.map((t) => (
          <SelectItem key={t} value={t}>
            {formatDate(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CompareClient({ tags }: { tags: string[] }) {
  const [base, setBase] = useState(tags.at(-1) ?? "");
  const [head, setHead] = useState(tags[0] ?? "");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blamePath, setBlamePath] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setBlamePath(null);
    try {
      const res = await fetch(
        `/api/compare?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de comparaison");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">De</span>
          <TagSelect value={base} onChange={setBase} tags={tags} />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">À</span>
          <TagSelect value={head} onChange={setHead} tags={tags} />
        </div>
        <Button onClick={run} disabled={loading || !base || !head || base === head}>
          {loading ? "Comparaison…" : "Comparer"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {result.files.length} fichier(s) · {result.aheadBy} version(s) d’écart
            {result.truncated && " · liste tronquée"}
          </p>
          {result.files.map((file, i) => (
            <div key={`${file.filename}-${i}`} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs break-all">{file.filename}</span>
                {file.status !== "removed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setBlamePath((p) => (p === file.filename ? null : file.filename))
                    }
                  >
                    {blamePath === file.filename ? "Masquer le blame" : "Blame"}
                  </Button>
                )}
              </div>
              {blamePath === file.filename ? (
                <BlameView tag={head} path={file.filename} />
              ) : (
                <DiffFileView file={file} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
