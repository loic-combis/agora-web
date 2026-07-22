"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { NAV_ITEMS, isActive } from "./items";

export function Side() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed top-0 left-0 z-40 hidden h-dvh w-16 flex-col items-center justify-center gap-2 border-r border-border bg-background md:flex"
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex size-11 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
              active && "text-foreground",
            )}
          >
            <HugeiconsIcon
              icon={icon}
              size={24}
              strokeWidth={active ? 2.25 : 1.5}
              aria-hidden
            />
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full ml-3 origin-left scale-95 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-all group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
