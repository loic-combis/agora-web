import { listTags } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

// Client-side pagination for the History timeline. Server Components call
// `listTags` directly; the client "Load more" goes through here.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 100);

  try {
    const page = await listTags(limit, cursor);
    return NextResponse.json(page);
  } catch {
    // Token-resilient: mirror the SSR path's empty state instead of 500-ing.
    return NextResponse.json({ entries: [], nextCursor: null });
  }
}
