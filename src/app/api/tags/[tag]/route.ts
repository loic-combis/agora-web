import { getDay } from "@/lib/github";
import { errorResponse, json } from "@/lib/http";

// GET /api/tags/[tag]?page=  → parsed commit message + diff vs previous day.
// Paginated because the seed day has ~13k files (GitHub caps at 300/page).
export async function GET(request: Request, ctx: RouteContext<"/api/tags/[tag]">) {
  try {
    const { tag } = await ctx.params;
    const page = Math.max(Number(new URL(request.url).searchParams.get("page")) || 1, 1);
    return json(await getDay(tag, page), "immutable");
  } catch (err) {
    return errorResponse(err);
  }
}
