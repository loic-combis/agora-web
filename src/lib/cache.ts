// Revalidation windows (seconds). Historical law is immutable per tag, so most
// responses cache aggressively; the tag list is short-lived since daily builds
// can push new tags.
export const REVALIDATE = {
  /** Tag/history listing — a new daily tag should show up within minutes. */
  history: 300,
  /** Per-tag content (commit, diff, tree, file, blame) — effectively immutable. */
  immutable: 86_400,
} as const;
