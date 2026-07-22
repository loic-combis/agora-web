import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleRef, DayChangeset, TextChange } from "@/lib/types";

function ArticleList({ label, items, tone }: { label: string; items: ArticleRef[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {items.map((a) => (
        <Badge key={a.legiarti} variant="outline" className={tone} title={a.legiarti}>
          {a.title}
        </Badge>
      ))}
    </div>
  );
}

function TextCard({ record }: { record: TextChange }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{record.name}</CardTitle>
        <p className="font-mono text-xs text-muted-foreground">{record.legitext}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ArticleList
          label="Entrés"
          items={record.entered}
          tone="border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
        />
        <ArticleList
          label="Sortis"
          items={record.left}
          tone="border-red-500/40 text-red-700 dark:text-red-400"
        />
        {record.acts.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xs font-medium text-muted-foreground">Actes</span>
            {record.acts.map((act) =>
              act.jorfUrl ? (
                <a
                  key={act.cid}
                  href={act.jorfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {act.label || act.cid} ↗
                </a>
              ) : (
                <span key={act.cid} className="text-xs">
                  {act.label || act.cid}
                </span>
              ),
            )}
          </div>
        )}
        {record.signers.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Signataires</span>
            {record.signers.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Render a day's parsed commit message as per-text cards. */
export function ChangesetView({ changeset }: { changeset: DayChangeset }) {
  if (changeset.records.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun changement de texte ce jour.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {changeset.records.map((r) => (
          <TextCard key={r.legitext} record={r} />
        ))}
      </div>
      {changeset.coauthors.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-1.5 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">Co-auteurs</span>
          {changeset.coauthors.map((c) => (
            <Badge key={c.email} variant="outline" title={c.email}>
              {c.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
