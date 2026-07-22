"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { NAV_ITEMS, isActive } from "./items";

export function Dock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
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
              "flex h-14 flex-1 items-center justify-center text-foreground/70 transition-colors active:text-foreground",
              active && "text-foreground",
            )}
          >
            <HugeiconsIcon
              icon={icon}
              size={24}
              strokeWidth={active ? 2.25 : 1.5}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}
