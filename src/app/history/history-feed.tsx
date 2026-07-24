"use client";

import { Button } from "@/components/ui/button";
import { parseCommitMessage, partitionArticles } from "@/lib/parse-commit";
import { slugifyName } from "@/lib/slug";
import { ArticleRef, HistoryEntry, HistoryPage, TextChange } from "@/lib/types";
import {
  BanIcon,
  CheckmarkCircle03Icon,
  Certificate01Icon,
  Loading03Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

// A labelled row (optional leading icon + inline, wrapping content) that clamps to
// two lines by default and reveals a muted "Voir plus / Voir moins" toggle only
// when the content actually overflows. The icon never shrinks and pins to the top.
function CollapsibleRow({
  icon,
  iconClassName,
  contentClassName,
  children,
}: {
  icon?: typeof CheckmarkCircle03Icon;
  iconClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clampable, setClampable] = useState(false);

  // `scrollHeight` reports the full content height whether or not it is clamped,
  // so comparing it to two line-heights tells us if the toggle is needed — in
  // either state, and on width changes (via the ResizeObserver).
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 16;
      setClampable(el.scrollHeight > lh * 2 + 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <span className="flex gap-2 items-start">
      {icon && (
        <HugeiconsIcon
          icon={icon}
          size={14}
          strokeWidth={2}
          aria-hidden
          className={`shrink-0 mt-0.5 ${iconClassName ?? ""}`}
        />
      )}

      <span className="flex flex-col gap-0.5 min-w-0 flex-1 items-start">
        <span
          ref={contentRef}
          className={`text-xs ${contentClassName ?? ""} ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {children}
        </span>

        {clampable && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-muted-foreground hover:underline"
          >
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        )}
      </span>
    </span>
  );
}

// One labelled row of article links (added / removed / edited) under a text,
// rendered inline so it can clamp to two lines. Each article links to the day's
// diff for its text, anchored to the article (by CID = its file in the diff).
function ArticleList({
  icon,
  iconClassName,
  listClassName,
  date,
  legitext,
  articles,
}: {
  icon: typeof CheckmarkCircle03Icon;
  iconClassName: string;
  listClassName?: string;
  date: string;
  legitext: string;
  articles: ArticleRef[];
}) {
  if (articles.length === 0) return null;
  return (
    <CollapsibleRow
      icon={icon}
      iconClassName={iconClassName}
      contentClassName={listClassName}
    >
      {articles.map((art, index) => (
        <span key={art.legiarti}>
          <Link
            href={`/compare/${date}/${legitext}#${art.cid}`}
            className="hover:underline"
          >
            {art.title}
          </Link>
          {index < articles.length - 1 ? ", " : ""}
        </span>
      ))}
    </CollapsibleRow>
  );
}

// The day's signatories as links to their person page. Names keep their accents
// (they come straight from the commit text); the slug is derived with the same
// rule the replay used to sign commits, so the link resolves to every commit the
// person is tied to.
function SignerList({ signers }: { signers: string[] }) {
  if (signers.length === 0) return null;
  return (
    <CollapsibleRow contentClassName="text-muted-foreground">
      {signers.map((name, index) => (
        <span key={`${name}-${index}`}>
          <Link
            href={`/persons/${slugifyName(name)}`}
            className="hover:underline"
          >
            {name}
          </Link>
          {index < signers.length - 1 ? ", " : ""}
        </span>
      ))}
    </CollapsibleRow>
  );
}

// One text's changes on a given day: a card (title → the day's diff for this text,
// its article transitions, its signatories) with two small muted links underneath.
function TextCard({ date, record }: { date: string; record: TextChange }) {
  const { entered, left, edited } = partitionArticles(record);
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="border rounded-lg p-4 flex flex-col gap-1">
        <Link
          href={`/compare/${date}/${record.legitext}`}
          className="hover:underline font-semibold text-sm"
        >
          {record.name}
        </Link>

        <ArticleList
          icon={CheckmarkCircle03Icon}
          iconClassName="text-green-500"
          date={date}
          legitext={record.legitext}
          articles={entered}
        />
        <ArticleList
          icon={Edit01Icon}
          iconClassName="text-amber-500"
          date={date}
          legitext={record.legitext}
          articles={edited}
        />
        <ArticleList
          icon={BanIcon}
          iconClassName="text-red-500"
          listClassName="line-through"
          date={date}
          legitext={record.legitext}
          articles={left}
        />

        <SignerList signers={record.signers} />
      </div>

      <div className="flex gap-2 px-1">
        <Link
          href={`/history/texts/${record.legitext}`}
          className="text-[11px] text-muted-foreground hover:underline"
        >
          Voir les Versions
        </Link>
        <a
          href={
            "https://www.legifrance.gouv.fr/codes/texte_lc/" + record.legitext
          }
          target="_blank"
          className="text-[11px] text-muted-foreground hover:underline"
        >
          Voir sur Légifrance
        </a>
      </div>
    </div>
  );
}

// Renders the History timeline and owns its pagination: the opaque GraphQL
// cursor + accumulated entries. Server Components call `listTags` directly for
// SSR; the client "Load more" goes through the `/api/history` route handler.
export default function HistoryFeed({
  initialEntries,
  initialCursor,
}: {
  initialEntries: HistoryEntry[];
  initialCursor: string | null;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const cursor = useRef(initialCursor);
  const [hasMore, setHasMore] = useState(initialCursor !== null);
  const [pending, startTransition] = useTransition();

  const parsedMessages = useMemo(() => {
    return entries.map((entry) => parseCommitMessage(entry.message));
  }, [entries]);

  const loadMore = () =>
    startTransition(async () => {
      const params = new URLSearchParams();
      if (cursor.current) params.set("cursor", cursor.current);
      const res = await fetch(`/api/history?${params}`);
      const page: HistoryPage = await res.json();

      setEntries((prev) => [...prev, ...page.entries]);
      cursor.current = page.nextCursor;
      setHasMore(page.nextCursor !== null);
    });

  return (
    <>
      <div className="flex w-full">
        <ul className="flex flex-col gap-10 w-full">
          {entries.map((entry, index) => (
            <li key={entry.tag} className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Link
                  href={`/compare/${entry.tag}`}
                  className="text-sm capitalize hover:underline italic"
                >
                  {format(entry.date, "EEEE d MMMM yyyy", { locale: fr })}
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {parsedMessages[index].records.map((record) => (
                  <TextCard
                    key={record.legitext}
                    date={entry.tag}
                    record={record}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-8 pl-6">
          <Button variant="outline" disabled={pending} onClick={loadMore}>
            {pending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="animate-spin"
                aria-hidden
              />
            )}
            {pending ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
