import { compare } from "@/lib/github";
import { errorResponse, json } from "@/lib/http";

// GET /api/compare?base=<tag>&head=<tag>&page=  → diff between two versions.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base");
    const head = searchParams.get("head");
    if (!base || !head) {
      return Response.json({ error: "base and head are required" }, { status: 400 });
    }
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    return json(await compare(base, head, page), "immutable");
  } catch (err) {
    return errorResponse(err);
  }
}
