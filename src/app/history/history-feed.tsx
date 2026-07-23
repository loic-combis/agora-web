"use client";

import { Button } from "@/components/ui/button";
import { parseCommitMessage } from "@/lib/parse-commit";
import { HistoryEntry, HistoryPage } from "@/lib/types";
import {
  Certificate01Icon,
  FileAddIcon,
  FileRemoveIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useRef, useState, useTransition } from "react";

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
                    {parsedMessages[index].records.map((record) => (
                      <li key={record.legitext} className="flex flex-col gap-1">
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

                        {record.entered.length > 0 && (
                          <span className="flex gap-2">
                            <HugeiconsIcon
                              icon={FileAddIcon}
                              size={14}
                              strokeWidth={2}
                              aria-hidden
                              className="text-green-500"
                            />

                            <ul className="flex gap-1 flex-wrap">
                              {record.entered.map((art, index) => {
                                const isLast =
                                  index === record.entered.length - 1;
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
                        )}

                        {record.left.length > 0 && (
                          <span className="flex gap-2">
                            <HugeiconsIcon
                              icon={FileRemoveIcon}
                              size={14}
                              strokeWidth={2}
                              aria-hidden
                              className="text-red-500"
                            />

                            <ul className="flex gap-1 flex-wrap">
                              {record.left.map((art, index) => {
                                const isLast = index === record.left.length - 1;
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
                        )}
                      </li>
                    ))}
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
