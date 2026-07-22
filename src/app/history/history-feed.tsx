"use client";

import { Button } from "@/components/ui/button";
import { HistoryEntry, HistoryPage } from "@/lib/types";
import { Certificate01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRef, useState, useTransition } from "react";

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
          {entries.map((entry) => (
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
                <div className="border rounded-lg p-4">
                  <span className="text-xs">{entry.message}</span>
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
