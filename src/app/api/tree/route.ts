import { tree } from "@/lib/github";
import { errorResponse, json } from "@/lib/http";

// GET /api/tree?ref=<tag>&path=<dir>  → directory listing (path="" = roots).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");
    if (!ref) return Response.json({ error: "ref is required" }, { status: 400 });
    const path = searchParams.get("path") ?? "";
    return json(await tree(ref, path), "immutable");
  } catch (err) {
    return errorResponse(err);
  }
}
