"use client";

import { Button } from "@/components/ui/button";
import { parseCommitMessage, partitionArticles } from "@/lib/parse-commit";
import { ArticleRef, HistoryEntry, HistoryPage } from "@/lib/types";
import {
  BanIcon,
  CheckmarkCircle03Icon,
  Certificate01Icon,
  Loading03Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useRef, useState, useTransition } from "react";

// One labelled row of article links (added / removed / edited) under a text.
// The leading icon never shrinks and stays pinned to the first wrapped line.
function ArticleList({
  icon,
  iconClassName,
  listClassName,
  articles,
}: {
  icon: typeof CheckmarkCircle03Icon;
  iconClassName: string;
  listClassName?: string;
  articles: ArticleRef[];
}) {
  if (articles.length === 0) return null;
  return (
    <span className="flex gap-2 items-start">
      <HugeiconsIcon
        icon={icon}
        size={14}
        strokeWidth={2}
        aria-hidden
        className={`shrink-0 mt-0.5 ${iconClassName}`}
      />

      <ul className={`flex gap-1 flex-wrap ${listClassName ?? ""}`}>
        {articles.map((art, index) => {
          const isLast = index === articles.length - 1;
          return (
            <li
              key={art.legiarti}
              className="text-xs flex items-center gap-1"
            >
              <a
                href={
                  "https://www.legifrance.gouv.fr/codes/article_lc/" +
                  art.legiarti
                }
                target="_blank"
                className="hover:underline"
              >
                {art.title + (isLast ? "" : ",")}
              </a>
            </li>
          );
        })}
      </ul>
    </span>
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
      <div className="relative flex w-full justify-center border-l-2">
        <ul className="flex flex-col gap-8 w-full">
          {entries.map((entry, index) => (
            <li
              key={entry.tag}
              className="flex flex-col gap-2 bg-background w-full"
            >
              <span className="flex gap-2 relative items-center text-muted-foreground">
                <span className="absolute -translate-x-1/2 p-2 bg-background">
                  <HugeiconsIcon
                    icon={Certificate01Icon}
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </span>

                <span className="pl-6 text-md capitalize">
                  {format(entry.date, "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              </span>

              <div className="flex flex-col pl-6">
                <div className="border rounded-lg p-4 flex flex-col">
                  <ul className="flex flex-col gap-4">
                    {parsedMessages[index].records.map((record) => {
                      const { entered, left, edited } =
                        partitionArticles(record);
                      return (
                        <li
                          key={record.legitext}
                          className="flex flex-col gap-1"
                        >
                          <a
                            href={
                              "https://www.legifrance.gouv.fr/codes/texte_lc/" +
                              record.legitext
                            }
                            target="_blank"
                            className="hover:underline font-semibold text-sm"
                          >
                            {record.name}
                          </a>
                          <span className="font-semibold"></span>

                          <ArticleList
                            icon={CheckmarkCircle03Icon}
                            iconClassName="text-green-500"
                            articles={entered}
                          />
                          <ArticleList
                            icon={PencilEdit02Icon}
                            iconClassName="text-amber-500"
                            articles={edited}
                          />
                          <ArticleList
                            icon={BanIcon}
                            iconClassName="text-red-500"
                            listClassName="line-through"
                            articles={left}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
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
