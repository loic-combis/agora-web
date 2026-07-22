import { listTags } from "@/lib/github";
import { errorResponse, json } from "@/lib/http";

// GET /api/history?limit=&cursor=  → paginated tag list with parsed summaries.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const cursor = searchParams.get("cursor") ?? undefined;
    return json(await listTags(limit, cursor), "history");
  } catch (err) {
    return errorResponse(err);
  }
}
