import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sectors",
  description: "S&P 500 sector aggregates: size, valuation, growth, quality.",
};
export const revalidate = 3600;

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export default async function SectorsPage() {
  const client = db();
  const [{ data: companies }, { data: metrics }] = await Promise.all([
    client.from("mm_companies").select("ticker,name,sector,market_cap").eq("is_sp500", true),
    client.from("mm_metrics").select("ticker,data"),
  ]);
  const metricsBy = new Map((metrics ?? []).map((m) => [m.ticker, m.data as Record<string, unknown>]));

  const bySector = new Map<
    string,
    { tickers: { ticker: string; name: string; mcap: number }[]; pfcf: number[]; rev5: number[]; quality: number[] }
  >();

  for (const c of companies ?? []) {
    if (!c.sector || c.market_cap == null) continue;
    const entry = bySector.get(c.sector) ?? { tickers: [], pfcf: [], rev5: [], quality: [] };
    entry.tickers.push({ ticker: c.ticker, name: c.name, mcap: c.market_cap });
    const d = metricsBy.get(c.ticker);
    const num = (k: string) => {
      const v = d?.[k];
      return typeof v === "number" && isFinite(v) ? v : null;
    };
    const pfcf = num("pfcf");
    const rev5 = num("rev_cagr_5y");
    const q = num("quality_score");
    if (pfcf != null && pfcf > 0 && pfcf < 200) entry.pfcf.push(pfcf);
    if (rev5 != null) entry.rev5.push(rev5);
    if (q != null) entry.quality.push(q);
    bySector.set(c.sector, entry);
  }

  const sectors = [...bySector.entries()]
    .map(([name, e]) => ({
      name,
      count: e.tickers.length,
      totalMcap: e.tickers.reduce((s, t) => s + t.mcap, 0),
      medPfcf: median(e.pfcf),
      medRev5: median(e.rev5),
      medQuality: median(e.quality),
      top: e.tickers.sort((a, b) => b.mcap - a.mcap).slice(0, 5),
    }))
    .sort((a, b) => b.totalMcap - a.totalMcap);

  const grandTotal = sectors.reduce((s, x) => s + x.totalMcap, 0);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sectors</h1>
      <p className="text-sm text-muted mt-1">
        GICS sectors of the S&amp;P 500 — weight, median valuation, growth, and quality.
      </p>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {sectors.map((s) => (
          <Card key={s.name} id={s.name} className="p-5 scroll-mt-20">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">{s.name}</h2>
              <span className="text-xs text-faint tnum">{s.count} companies</span>
            </div>

            <div className="mt-2 h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
              <div
                className="h-full bg-accent/70 rounded-full"
                style={{ width: `${Math.max((s.totalMcap / grandTotal) * 100, 1)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-faint tnum">
              {fmtMoney(s.totalMcap)} · {fmtPct(s.totalMcap / grandTotal)} of index
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-faint">Median P/FCF</p>
                <p className="tnum font-medium">{s.medPfcf != null ? fmtNum(s.medPfcf, 1) : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-faint">Median rev 5y</p>
                <p className="tnum font-medium">{fmtPct(s.medRev5)}</p>
              </div>
              <div>
                <p className="text-[11px] text-faint">Median quality</p>
                <p className="tnum font-medium">{s.medQuality != null ? Math.round(s.medQuality) : "—"}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.top.map((t) => (
                <Link
                  key={t.ticker}
                  href={`/company/${t.ticker}`}
                  className="px-2 py-0.5 rounded-md border border-border text-xs font-mono text-muted hover:text-foreground hover:border-border-strong transition-colors"
                >
                  {t.ticker}
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
