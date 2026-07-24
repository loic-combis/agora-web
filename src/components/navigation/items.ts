import {
  Home01Icon,
  CourtHouseIcon,
  HistoryIcon,
  FileDiffIcon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type NavItem = {
  href: string;
  label: string;
  icon: IconSvgElement;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/law", label: "Law", icon: CourtHouseIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/persons", label: "Persons", icon: UserSearch01Icon },
  { href: "/compare", label: "Compare", icon: FileDiffIcon },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
