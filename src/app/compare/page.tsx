import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { AnnualFundamentals } from "@/lib/metrics";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import { LineChart } from "@/components/charts";
import { Card, Section } from "@/components/ui";
import { CompareInput } from "./input";

export const metadata: Metadata = {
  title: "Compare",
  description: "Indexed comparison of revenue, FCF and capital efficiency across companies.",
};
export const revalidate = 3600;

type Props = { searchParams: Promise<{ tickers?: string }> };

const DEFAULT = "AAPL,MSFT,GOOGL,AMZN";

export default async function ComparePage({ searchParams }: Props) {
  const { tickers: raw } = await searchParams;
  const tickers = (raw ?? DEFAULT)
    .toUpperCase()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

  const client = db();
  const { data: rows } = await client
    .from("mm_fundamentals_annual")
    .select("*")
    .in("ticker", tickers)
    .order("fiscal_year", { ascending: true });

  const byTicker = new Map<string, AnnualFundamentals[]>();
  for (const r of (rows ?? []) as (AnnualFundamentals & { ticker: string })[]) {
    const arr = byTicker.get(r.ticker) ?? [];
    arr.push(r);
    byTicker.set(r.ticker, arr);
  }
  const present = tickers.filter((t) => byTicker.has(t));

  const allYears = [
    ...new Set((rows ?? []).map((r) => (r as { fiscal_year: number }).fiscal_year)),
  ].sort((a, b) => a - b);
  const years = allYears.filter((y) => y >= (allYears[allYears.length - 1] ?? 0) - 14);

  /** Indexed to 100 at the first year both series overlap. */
  function indexed(key: keyof AnnualFundamentals) {
    return present.map((t) => {
      const rs = byTicker.get(t)!;
      const byYear = new Map(rs.map((r) => [r.fiscal_year, r[key] as number | null]));
      const firstVal = years.map((y) => byYear.get(y)).find((v) => v != null && v > 0);
      return {
        name: t,
        values: years.map((y) => {
          const v = byYear.get(y);
          return v != null && firstVal ? (v / firstVal) * 100 : null;
        }),
      };
    });
  }

  /** Sales efficiency per year: Δ net PP&E / Δ revenue. */
  const salesEff = present.map((t) => {
    const rs = byTicker.get(t)!;
    const byYear = new Map(rs.map((r) => [r.fiscal_year, r]));
    return {
      ticker: t,
      values: years.map((y) => {
        const cur = byYear.get(y);
        const prev = byYear.get(y - 1);
        if (!cur?.ppne || !prev?.ppne || cur.revenue == null || prev.revenue == null)
          return null;
        const dRev = cur.revenue - prev.revenue;
        const dPpne = cur.ppne - prev.ppne;
        if (dRev <= 0) return dPpne > 0 ? Infinity : null;
        return dPpne / dRev;
      }),
    };
  });

  return (
    <div className="py-8 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
        <p className="text-sm text-muted mt-1">
          Fundamentals indexed to 100 at the common starting year — growth trajectories,
          not absolute size.
        </p>
        <div className="mt-4 max-w-xl">
          <CompareInput initial={present.join(",")} />
        </div>
      </div>

      {present.length >= 2 ? (
        <>
          <Section title="Revenue, indexed">
            <Card className="p-4">
              <LineChart series={indexed("revenue")} labels={years} formatY={(v) => fmtNum(v, 0)} height={260} />
            </Card>
          </Section>

          <Section title="Free cash flow, indexed">
            <Card className="p-4">
              <LineChart series={indexed("fcf")} labels={years} formatY={(v) => fmtNum(v, 0)} height={260} />
            </Card>
          </Section>

          <Section title="Diluted shares, indexed" subtitle="Falling lines are buying back stock; rising lines are diluting you">
            <Card className="p-4">
              <LineChart series={indexed("shares_diluted")} labels={years} formatY={(v) => fmtNum(v, 0)} height={220} />
            </Card>
          </Section>

          <Section
            title="Sales efficiency"
            subtitle="New net PP&E required per $1 of new revenue. Below $0.50 is capital-light; a climb toward $1+ means the business is getting more capital-hungry."
          >
            <div className="overflow-x-auto border border-border rounded-xl bg-surface">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted sticky left-0 bg-surface">FY</th>
                    {salesEff.map((s) => (
                      <th key={s.ticker} className="px-3 py-2 font-mono font-semibold text-right">{s.ticker}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {years.map((y, yi) => (
                    <tr key={y} className="border-b border-border last:border-0 text-right tnum">
                      <td className="text-left px-3 py-1.5 font-medium sticky left-0 bg-surface">{y}</td>
                      {salesEff.map((s) => {
                        const v = s.values[yi];
                        return (
                          <td
                            key={s.ticker}
                            className={`px-3 py-1.5 ${
                              v == null ? "text-faint" : v === Infinity ? "text-negative" : v > 1 ? "text-warning" : v < 0.5 ? "text-positive" : ""
                            }`}
                          >
                            {v == null ? "—" : v === Infinity ? "∞" : fmtNum(v, 2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      ) : (
        <p className="text-sm text-muted">
          Enter at least two tickers with data (e.g. {DEFAULT}).
        </p>
      )}
    </div>
  );
}
