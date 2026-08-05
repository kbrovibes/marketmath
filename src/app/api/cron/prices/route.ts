import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/supabase";
import { fetchMonthly } from "@/lib/ingest/yahoo";
import { sleep } from "@/lib/ingest/sec";

export const maxDuration = 300;

/**
 * Daily price refresh. ?part=0|1 splits the universe to stay within limits.
 * Also refreshes the current month's row and market cap.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const part = parseInt(req.nextUrl.searchParams.get("part") ?? "0");
  const db = dbAdmin();
  const { data: companies } = await db
    .from("mm_companies")
    .select("ticker,shares_outstanding")
    .order("ticker");
  if (!companies) return NextResponse.json({ error: "no companies" }, { status: 500 });

  const mine = companies.filter((_, i) => i % 2 === part);
  let ok = 0;
  const errors: string[] = [];

  for (const c of mine) {
    try {
      const { quote, monthly } = await fetchMonthly(c.ticker, 1);
      const last = monthly[monthly.length - 1];
      if (last)
        await db.from("mm_prices_monthly").upsert(
          { ticker: c.ticker, month: last.month, close: last.close, adj_close: last.adjClose },
          { onConflict: "ticker,month" }
        );
      await db
        .from("mm_companies")
        .update({
          price: quote.price,
          week52_high: quote.week52High,
          week52_low: quote.week52Low,
          market_cap:
            c.shares_outstanding != null ? quote.price * c.shares_outstanding : null,
          price_updated_at: new Date().toISOString(),
        })
        .eq("ticker", c.ticker);
      ok++;
    } catch (e) {
      errors.push(`${c.ticker}: ${(e as Error).message}`);
    }
    await sleep(150);
  }

  return NextResponse.json({ part, ok, failed: errors.length, errors: errors.slice(0, 10) });
}
