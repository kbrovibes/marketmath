import { NextRequest, NextResponse } from "next/server";
import { ensureCompany } from "@/lib/ingest/on-demand";

export const maxDuration = 300;

/**
 * Remote-operable refresh: re-ingest specific tickers without local tooling.
 * DELETE-free and idempotent. Auth: Bearer CRON_SECRET.
 *   GET /api/admin/refresh?tickers=AAPL,MSFT
 * Existing tickers are refreshed by clearing nothing — ensureCompany early-outs
 * on existing rows, so for those we force a re-resolve via the fundamentals path.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tickers = (req.nextUrl.searchParams.get("tickers") ?? "")
    .toUpperCase()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (tickers.length === 0)
    return NextResponse.json({ error: "tickers required" }, { status: 400 });

  const results: Record<string, string> = {};
  for (const t of tickers) {
    try {
      const ok = await ensureCompany(t, { force: true });
      results[t] = ok ? "ok" : "failed";
    } catch (e) {
      results[t] = (e as Error).message;
    }
  }
  return NextResponse.json({ results });
}
