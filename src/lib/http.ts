// Small helpers for the route handlers: consistent JSON responses with CDN cache
// headers, and error → status mapping for GitHub failures.
import { REVALIDATE } from "./cache";

type Kind = keyof typeof REVALIDATE;

function cacheControl(kind: Kind): string {
  const s = REVALIDATE[kind];
  const swr = kind === "immutable" ? 604_800 : s * 2;
  return `public, s-maxage=${s}, stale-while-revalidate=${swr}`;
}

export function json(data: unknown, kind: Kind): Response {
  return Response.json(data, { headers: { "Cache-Control": cacheControl(kind) } });
}

interface GhError {
  status?: number;
  message?: string;
}

/** Map a thrown error to a JSON error response, preserving GitHub status codes. */
export function errorResponse(err: unknown): Response {
  const e = err as GhError;
  const status = typeof e?.status === "number" ? e.status : 500;
  const message = e?.message ?? "Unexpected error";
  return Response.json({ error: message }, { status });
}
