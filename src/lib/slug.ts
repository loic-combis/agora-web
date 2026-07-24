// Slug ⇄ name for signatories. The slug MUST stay identical to the one the replay
// pipeline bakes into commit authorship — `tasks/build_law_history.py::slug_email`:
//
//   NFKD-normalise the name, drop every non-ASCII char, replace runs of
//   non-alphanumerics with "-", trim "-", lowercase; empty -> "inconnu".
//   The synthesised commit email is "<slug>@agora-legi.local".
//
// That equality is what lets a `/persons/<slug>` page map back to every commit the
// person signed (author email + Co-authored-by trailers).
//
// NB: the slug is LOSSY — accents are stripped — so a slug alone cannot rebuild the
// accented name. `humanizeSlug` is a best-effort ASCII fallback only; the real
// accented name comes from the signer string in the feed, or from the person's
// commit metadata on the persons page.

export const SIGNATURE_EMAIL_DOMAIN = "agora-legi.local";

/** Encode a name to its signatory slug — mirrors build_law_history.slug_email. */
export function slugifyName(name: string): string {
  const ascii = name.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  const slug = ascii
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "inconnu";
}

/** The synthesised commit email for a slug — the key to find a person's commits. */
export function personEmail(slug: string): string {
  return `${slug}@${SIGNATURE_EMAIL_DOMAIN}`;
}

/** Full email for a name (identical to slug_email in the replay pipeline). */
export function emailForName(name: string): string {
  return personEmail(slugifyName(name));
}

/** Best-effort readable name from a slug (ASCII only — accents are unrecoverable
 *  from the slug; prefer the real name from commit data when it is available). */
export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
