import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const like = q.replace(/[%_]/g, "");
  const { data, error } = await db()
    .from("mm_companies")
    .select("ticker,name,sector")
    .or(`ticker.ilike.${like}%,name.ilike.%${like}%`)
    .order("market_cap", { ascending: false, nullsFirst: false })
    .limit(8);

  if (error) return NextResponse.json({ results: [] }, { status: 200 });
  return NextResponse.json({ results: data });
}
