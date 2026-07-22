// Display helpers: French category labels, dates, and change-status styling.

/** Friendly labels for the 9 top-level category directories. */
export const CATEGORY_LABELS: Record<string, string> = {
  codes: "Codes",
  arretes: "Arrêtés",
  decret: "Décrets",
  "decret-loi": "Décrets-lois",
  lois: "Lois",
  ordonnances: "Ordonnances",
  constitution: "Constitution",
  declarations: "Déclarations",
  textes: "Autres textes",
};

export function categoryLabel(segment: string): string {
  return CATEGORY_LABELS[segment] ?? segment;
}

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** ISO or YYYY-MM-DD → "4 janvier 1970". */
export function formatDate(value: string): string {
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? value : DATE_FMT.format(d);
}

/** Tailwind classes / labels for a git diff file status. */
export function statusStyle(status: string): { label: string; className: string } {
  switch (status) {
    case "added":
      return { label: "ajouté", className: "text-emerald-600 dark:text-emerald-400" };
    case "removed":
      return { label: "supprimé", className: "text-red-600 dark:text-red-400" };
    case "renamed":
      return { label: "renommé", className: "text-blue-600 dark:text-blue-400" };
    default:
      return { label: "modifié", className: "text-amber-600 dark:text-amber-400" };
  }
}

/** Strip the `LEGITEXT<id>__` prefix and turn `_` into spaces for display. */
export function prettyName(name: string): string {
  return name
    .replace(/\.md$/, "")
    .replace(/^LEGI(TEXT|SCTA|ARTI)\d+__?/, "")
    .replace(/_/g, " ")
    .trim();
}
