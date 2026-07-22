import { parsePatch, type DiffLineType } from "@/lib/parse-patch";
import { prettyName, statusStyle } from "@/lib/format";
import type { DiffFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROW_BG: Record<DiffLineType, string> = {
  add: "bg-emerald-500/10",
  del: "bg-red-500/10",
  context: "",
  hunk: "bg-muted text-muted-foreground",
};

const MARKER: Record<DiffLineType, string> = { add: "+", del: "-", context: " ", hunk: "" };

/** One file's unified diff, rendered GitHub-style with old/new line gutters. */
export function DiffFileView({ file }: { file: DiffFile }) {
  const status = statusStyle(file.status);
  const lines = file.patch ? parsePatch(file.patch) : null;

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/40 px-3 py-2 text-sm">
        <span className={cn("font-medium", status.className)}>{status.label}</span>
        <span className="font-mono text-xs break-all">{file.filename}</span>
        {file.previousFilename && (
          <span className="font-mono text-xs text-muted-foreground">
            ← {file.previousFilename}
          </span>
        )}
        <span className="ml-auto font-mono text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>{" "}
          <span className="text-red-600 dark:text-red-400">−{file.deletions}</span>
        </span>
      </div>

      {lines ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className={ROW_BG[line.type]}>
                  <td className="w-10 select-none border-r px-2 text-right text-muted-foreground">
                    {line.oldNo ?? ""}
                  </td>
                  <td className="w-10 select-none border-r px-2 text-right text-muted-foreground">
                    {line.newNo ?? ""}
                  </td>
                  <td className="w-4 select-none pl-2 text-muted-foreground">
                    {MARKER[line.type]}
                  </td>
                  <td className="whitespace-pre-wrap break-all pr-3">{line.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-3 py-4 text-sm text-muted-foreground">
          {prettyName(file.filename)} — diff non affiché (fichier volumineux ou binaire).
        </p>
      )}
    </div>
  );
}
