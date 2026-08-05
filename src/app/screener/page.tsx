import { db } from "@/lib/supabase";
import { ScreenerTable, ScreenerRow } from "./table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Screener",
  description: "Filter the S&P 500 on growth, returns, valuation, and quality.",
};
export const revalidate = 3600;

export default async function ScreenerPage() {
  const client = db();
  const [{ data: companies }, { data: metrics }] = await Promise.all([
    client
      .from("mm_companies")
      .select("ticker,name,sector,market_cap,price"),
    client.from("mm_metrics").select("ticker,data"),
  ]);

  const metricsBy = new Map((metrics ?? []).map((m) => [m.ticker, m.data]));
  const rows: ScreenerRow[] = (companies ?? [])
    .map((c) => {
      const d = (metricsBy.get(c.ticker) ?? {}) as Record<string, unknown>;
      const n = (k: string) => {
        const v = d[k];
        return typeof v === "number" && isFinite(v) ? v : null;
      };
      return {
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        mcap: c.market_cap,
        pe: n("pe"),
        pfcf: n("pfcf"),
        fcfYield: n("fcf_yield"),
        revCagr5: n("rev_cagr_5y"),
        epsCagr5: n("eps_cagr_5y"),
        roe: n("roe"),
        debtToFcf: n("debt_to_fcf"),
        shYield: n("shareholder_yield"),
        shareChange5: n("share_change_5y"),
        impliedGrowth: n("implied_fcf_growth"),
        quality: n("quality_score"),
        lynch: (d["lynch_class"] as string) ?? null,
        flags: Array.isArray(d["red_flags"]) ? (d["red_flags"] as unknown[]).length : null,
      };
    })
    .filter((r) => r.mcap != null);

  const sectors = [...new Set(rows.map((r) => r.sector).filter(Boolean))].sort() as string[];

  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Screener</h1>
      <p className="text-sm text-muted mt-1">
        {rows.length} S&amp;P 500 companies · fundamentals from latest 10-K filings ·
        every preset&apos;s rules are shown, nothing is a black box.
      </p>
      <div className="mt-6">
        <ScreenerTable rows={rows} sectors={sectors} />
      </div>
    </div>
  );
}
