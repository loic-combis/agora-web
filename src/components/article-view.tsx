import { Badge } from "@/components/ui/badge";
import { LawMarkdown } from "@/components/law-markdown";
import { formatDate } from "@/lib/format";
import type { ParsedArticle, ParsedDoc } from "@/lib/parse-article-md";

const ETAT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  VIGUEUR: "default",
  MODIFIE: "secondary",
  ABROGE: "destructive",
};

function ArticleCard({ article }: { article: ParsedArticle }) {
  return (
    <article className="rounded-lg border p-4">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">Article {article.num}</h3>
        {article.etat && (
          <Badge variant={ETAT_VARIANT[article.etat] ?? "outline"}>{article.etat}</Badge>
        )}
        {article.start && (
          <span className="text-xs text-muted-foreground">
            en vigueur : {formatDate(article.start)}
            {article.end ? ` → ${formatDate(article.end)}` : " → aujourd’hui"}
          </span>
        )}
        {article.legifranceUrl && (
          <a
            href={article.legifranceUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs text-primary underline underline-offset-2"
          >
            Légifrance ↗
          </a>
        )}
      </header>
      {article.body && <LawMarkdown>{article.body}</LawMarkdown>}
    </article>
  );
}

/** Render a parsed law document: header chips + one card per article. */
export function ArticleView({ doc }: { doc: ParsedDoc }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {doc.nature && <Badge variant="outline">{doc.nature}</Badge>}
          {doc.textId && <span className="font-mono">{doc.textId}</span>}
          {doc.sectionId && <span className="font-mono">{doc.sectionId}</span>}
        </div>
      </div>

      {doc.articles.length > 0 ? (
        <div className="space-y-3">
          {doc.articles.map((a, i) => (
            <ArticleCard key={a.legiarti ?? i} article={a} />
          ))}
        </div>
      ) : (
        doc.preamble && <LawMarkdown>{doc.preamble}</LawMarkdown>
      )}
    </div>
  );
}
