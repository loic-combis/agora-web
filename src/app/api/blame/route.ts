import { blame } from "@/lib/github";
import { errorResponse, json } from "@/lib/http";

// GET /api/blame?ref=<tag>&path=<file>  → blame ranges for a file at a tag.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");
    const path = searchParams.get("path");
    if (!ref || !path) {
      return Response.json({ error: "ref and path are required" }, { status: 400 });
    }
    return json(await blame(ref, path), "immutable");
  } catch (err) {
    return errorResponse(err);
  }
}
