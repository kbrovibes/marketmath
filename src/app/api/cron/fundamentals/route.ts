import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/supabase";
import {
  fetchCompanyFacts,
  resolveAnnual,
  resolveQuarterly,
  latestSharesOutstanding,
  sleep,
} from "@/lib/ingest/sec";
import { computeMetrics, AnnualFundamentals } from "@/lib/metrics";

export const maxDuration = 300;

/**
 * Weekly-rotation fundamentals refresh: each daily run covers tickers whose
 * cik % 7 equals today's weekday, so the whole universe refreshes weekly.
 * Recomputes derived metrics for refreshed tickers.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const day = new Date().getUTCDay();
  const db = dbAdmin();
  const { data: companies } = await db.from("mm_companies").select("ticker,cik");
  if (!companies) return NextResponse.json({ error: "no companies" }, { status: 500 });

  const mine = companies.filter(
    (c) => c.ticker !== "SPY" && parseInt(c.cik) % 7 === day
  );
  let ok = 0;
  const errors: string[] = [];

  for (const c of mine) {
    try {
      const cf = await fetchCompanyFacts(c.cik);
      const rows = resolveAnnual(cf, 20);
      if (rows.length > 0) {
        await db.from("mm_fundamentals_annual").upsert(
          rows.map((r) => ({
            ticker: c.ticker,
            fiscal_year: r.fiscal_year,
            end_date: r.end_date,
            ...r.values,
            source_tags: r.source_tags,
          })),
          { onConflict: "ticker,fiscal_year" }
        );
      }
      const quarters = resolveQuarterly(cf, rows);
      if (quarters.length > 0) {
        await db.from("mm_fundamentals_quarterly").upsert(
          quarters.map((q) => ({
            ticker: c.ticker,
            end_date: q.end_date,
            fiscal_year: q.fiscal_year,
            fq: q.fq,
            derived: q.derived,
            ...q.values,
          })),
          { onConflict: "ticker,end_date" }
        );
      }
      const shares = latestSharesOutstanding(cf);
      await db
        .from("mm_companies")
        .update({
          shares_outstanding: shares,
          fundamentals_updated_at: new Date().toISOString(),
        })
        .eq("ticker", c.ticker);

      const { data: allRows } = await db
        .from("mm_fundamentals_annual")
        .select("*")
        .eq("ticker", c.ticker)
        .order("fiscal_year", { ascending: false });
      const { data: comp } = await db
        .from("mm_companies")
        .select("price,market_cap,shares_outstanding")
        .eq("ticker", c.ticker)
        .single();
      if (allRows && allRows.length > 0 && comp) {
        const metrics = computeMetrics(allRows as AnnualFundamentals[], comp);
        await db.from("mm_metrics").upsert(
          { ticker: c.ticker, data: metrics, updated_at: new Date().toISOString() },
          { onConflict: "ticker" }
        );
      }
      ok++;
    } catch (e) {
      errors.push(`${c.ticker}: ${(e as Error).message}`);
    }
    await sleep(250);
  }

  return NextResponse.json({ day, ok, failed: errors.length, errors: errors.slice(0, 10) });
}
