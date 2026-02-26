import { NextRequest, NextResponse } from "next/server";
import { getAllCreatures } from "@/lib/folklore-data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  const all = getAllCreatures();
  const results = all
    .filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.n.toLowerCase().includes(q) ||
        (c.ln && c.ln.toLowerCase().includes(q)),
    )
    .slice(0, 20)
    .map((c) => ({
      id: c.id,
      name: c.n,
      localName: c.ln,
      country: c.country,
      region: c.region,
    }));

  return NextResponse.json(results);
}
