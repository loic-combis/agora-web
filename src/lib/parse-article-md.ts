// Parse a generated law Markdown file into a header + structured articles, so the
// browse page can render metadata chips (état, en-vigueur dates, Légifrance link)
// instead of raw HTML comments.

export interface ParsedArticle {
  num: string; // "45", "R5189-1", "Annexe 1", …
  legiarti: string | null;
  etat: string | null; // VIGUEUR | MODIFIE | ABROGE | …
  start: string | null; // en vigueur since
  end: string | null; // until (null = open / 2999 sentinel)
  legifranceUrl: string | null;
  body: string; // markdown body with the comment + Légifrance line stripped
}

export interface ParsedDoc {
  title: string;
  textId: string | null; // LEGITEXT…
  sectionId: string | null; // LEGISCTA… (structured docs)
  nature: string | null; // ARRETE | CODE | …
  articles: ParsedArticle[];
  preamble: string; // raw markdown before the first article (header block)
}

const OPEN_END = "2999-01-01";
const ARTICLE_META =
  /<!--\s*LEGIARTI:\s*(LEGIARTI\d+)\s*—\s*état:\s*(\w+)\s*—\s*en vigueur:\s*(\S+)\s*→\s*(\S+)\s*-->/;
const LEGIFRANCE = /\[Voir sur Légifrance\]\((https?:\/\/[^)]+)\)/;

export function parseArticleMarkdown(md: string): ParsedDoc {
  const title = /^#\s+(.+)$/m.exec(md)?.[1]?.trim() ?? "";
  const textMeta = /<!--\s*(LEGITEXT\d+)\s*—\s*nature:\s*(.*?)\s*-->/.exec(md);
  const identifiant = /\*\*Identifiant\s*:\*\*\s*`(LEGITEXT\d+)`/.exec(md)?.[1] ?? null;
  const sectionId = /<!--\s*LEGISCTA:\s*(LEGISCTA\d+)\s*-->/.exec(md)?.[1] ?? null;

  // Split on article headings; the first chunk is the header/preamble.
  const parts = md.split(/^### Article /m);
  const preamble = (parts.shift() ?? "").trim();

  const articles: ParsedArticle[] = parts.map((block) => {
    const nl = block.indexOf("\n");
    const num = (nl === -1 ? block : block.slice(0, nl)).trim();
    const rest = nl === -1 ? "" : block.slice(nl + 1);
    const m = ARTICLE_META.exec(rest);
    const end = m?.[4] && m[4] !== OPEN_END ? m[4] : null;
    const body = rest
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(LEGIFRANCE, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return {
      num,
      legiarti: m?.[1] ?? null,
      etat: m?.[2] ?? null,
      start: m?.[3] ?? null,
      end,
      legifranceUrl: LEGIFRANCE.exec(rest)?.[1] ?? null,
      body,
    };
  });

  return {
    title,
    textId: textMeta?.[1] ?? identifiant,
    sectionId,
    nature: textMeta?.[2]?.trim() || null,
    articles,
    preamble,
  };
}
