import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db, dbAdmin } from "@/lib/supabase";
import {
  AnnualFundamentals,
  Metrics,
  splitAdjust,
  dcfValue,
} from "@/lib/metrics";
import { fmtMoney, fmtNum, fmtPct, fmtPctSigned, fmtRatio, pctColor } from "@/lib/format";
import { BarSeries, LineChart, Sparkline } from "@/components/charts";
import { Badge, Card, Section, Stat } from "@/components/ui";
import {
  buildTrackRecord,
  buildDollarTest,
  buildReinvestment,
} from "@/lib/track-record";
import { ensureCompany } from "@/lib/ingest/on-demand";

export const revalidate = 3600;

type PageProps = { params: Promise<{ ticker: string }> };

async function getData(tickerRaw: string, useAdmin = false) {
  const ticker = tickerRaw.toUpperCase();
  // After on-demand ingestion the admin client is used for the re-read: its
  // different auth header bypasses Next's per-render fetch memoization, which
  // would otherwise replay the pre-ingestion empty responses.
  const client = useAdmin ? dbAdmin() : db();
  const [
    { data: company },
    { data: rows },
    { data: metrics },
    { data: prices },
    { data: spyPrices },
    { data: quarters },
  ] = await Promise.all([
    client.from("mm_companies").select("*").eq("ticker", ticker).maybeSingle(),
    client
      .from("mm_fundamentals_annual")
      .select("*")
      .eq("ticker", ticker)
      .order("fiscal_year", { ascending: true }),
    client.from("mm_metrics").select("data").eq("ticker", ticker).maybeSingle(),
    client
      .from("mm_prices_monthly")
      .select("month,adj_close")
      .eq("ticker", ticker)
      .order("month", { ascending: true }),
    client
      .from("mm_prices_monthly")
      .select("month,adj_close")
      .eq("ticker", "SPY")
      .order("month", { ascending: true }),
    client
      .from("mm_fundamentals_quarterly")
      .select("*")
      .eq("ticker", ticker)
      .order("end_date", { ascending: true }),
  ]);
  return {
    company,
    rows: (rows ?? []) as AnnualFundamentals[],
    metrics: metrics?.data as Metrics | undefined,
    prices: prices ?? [],
    spyPrices: spyPrices ?? [],
    quarters: (quarters ?? []) as QuarterlyRow[],
  };
}

type QuarterlyRow = {
  end_date: string;
  fiscal_year: number | null;
  fq: number | null;
  derived: boolean;
  revenue: number | null;
  net_income: number | null;
  eps_diluted: number | null;
};

function qLabel(q: QuarterlyRow): string {
  return q.fiscal_year && q.fq ? `Q${q.fq}'${String(q.fiscal_year).slice(-2)}` : q.end_date.slice(0, 7);
}

/** YoY change vs the quarter 4 positions earlier (same fiscal quarter). */
function qYoY(quarters: QuarterlyRow[], i: number, key: "revenue" | "net_income" | "eps_diluted"): number | null {
  const cur = quarters[i]?.[key];
  const prev = quarters[i - 4]?.[key];
  if (cur == null || prev == null || prev <= 0) return null;
  return cur / prev - 1;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params;
  return { title: ticker.toUpperCase() };
}

export default async function CompanyPage({ params }: PageProps) {
  const { ticker: raw } = await params;
  let data = await getData(raw);
  if (!data.company) {
    // Not in the seeded universe — try live ingestion from SEC EDGAR (any US filer)
    const ingested = await ensureCompany(raw);
    if (ingested) data = await getData(raw, true);
  }
  const { company, rows: rawRows, metrics: m, prices, spyPrices, quarters } = data;
  if (!company) notFound();
  const recentQ = quarters.slice(-13);

  const rows = splitAdjust(rawRows);
  const track = buildTrackRecord(rows, prices, spyPrices);
  const dollarTest = buildDollarTest(rows, prices);
  const reinvest = buildReinvestment(rows);
  const latest = rows[rows.length - 1];
  const years = rows.map((r) => r.fiscal_year);
  const isFinancial = latest?.gross_profit == null && latest?.operating_income == null;

  const series = (key: keyof AnnualFundamentals) =>
    rows.map((r) => ({ x: r.fiscal_year, y: (r[key] as number | null) ?? null }));

  const marginSeries = [
    {
      name: "Net margin",
      values: rows.map((r) =>
        r.net_income != null && r.revenue ? r.net_income / r.revenue : null
      ),
    },
    {
      name: "FCF margin",
      values: rows.map((r) => (r.fcf != null && r.revenue ? r.fcf / r.revenue : null)),
    },
    ...(isFinancial
      ? []
      : [
          {
            name: "Gross margin",
            values: rows.map((r) =>
              r.gross_profit != null && r.revenue ? r.gross_profit / r.revenue : null
            ),
          },
        ]),
  ];

  const histGrowth = m?.fcf_cagr_10y ?? m?.fcf_cagr_5y ?? null;
  const implied = m?.implied_fcf_growth ?? null;

  // Fair-value band from the latest FCF at conservative/base/optimistic growth
  const fv =
    latest?.fcf && latest.fcf > 0 && company.shares_outstanding
      ? {
          low: dcfValue(latest.fcf, Math.min(histGrowth ?? 0.04, 0.04)),
          base: dcfValue(latest.fcf, Math.min(histGrowth ?? 0.08, 0.15)),
          high: dcfValue(latest.fcf, Math.min((histGrowth ?? 0.08) + 0.03, 0.2)),
        }
      : null;

  const priceVals = prices.map((p) => p.adj_close as number | null);

  return (
    <div className="py-8 flex flex-col gap-10">
      {/* Header */}
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight font-mono">
            {company.ticker}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {m?.lynch_class && <Badge tone="accent">{m.lynch_class}</Badge>}
            {m?.quality && (
              <Badge
                tone={m.quality === "High" ? "positive" : m.quality === "Low" ? "negative" : "neutral"}
              >
                Quality: {m.quality} ({m.quality_score}/100)
              </Badge>
            )}
            {(m?.red_flags?.length ?? 0) > 0 && (
              <a href="#flags">
                <Badge tone="warning">
                  {m!.red_flags.length} red flag{m!.red_flags.length > 1 ? "s" : ""}
                </Badge>
              </a>
            )}
          </div>
        </div>
        <p className="text-muted mt-1">
          {company.name}
          {company.sector && (
            <>
              {" · "}
              <Link href={`/sectors#${encodeURIComponent(company.sector)}`} className="hover:text-foreground">
                {company.sector}
              </Link>
            </>
          )}
          {company.sub_industry && ` · ${company.sub_industry}`}
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-4xl font-semibold tnum tracking-tight">
              {company.price != null ? `$${fmtNum(company.price)}` : "—"}
            </p>
            <p className="text-xs text-faint mt-1 tnum">
              {company.week52_low != null && company.week52_high != null
                ? `52w ${fmtNum(company.week52_low)} – ${fmtNum(company.week52_high)}`
                : ""}
            </p>
          </div>
          {prices.length > 12 && (
            <div className="pb-1">
              <Sparkline data={priceVals} width={180} height={44} />
              <p className="text-[10px] text-faint mt-0.5">20y monthly, adjusted</p>
            </div>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-8 gap-y-3 ml-auto">
            <Stat label="Mkt cap" value={fmtMoney(company.market_cap)} />
            <Stat label="P/E" value={m?.pe != null ? fmtNum(m.pe, 1) : "—"} />
            <Stat label="P/FCF" value={m?.pfcf != null ? fmtNum(m.pfcf, 1) : "—"} />
            <Stat label="FCF yield" value={fmtPct(m?.fcf_yield)} />
            <Stat label="ROE" value={fmtPct(m?.roe)} />
            <Stat
              label="Shldr yield"
              value={fmtPct(m?.shareholder_yield)}
              sub={
                m?.dividend_yield != null
                  ? `div ${fmtPct(m.dividend_yield)} + bb ${fmtPct(m.buyback_yield)}`
                  : undefined
              }
            />
          </div>
        </div>
      </header>

      {/* What the price assumes */}
      {implied != null && (
        <Card className="p-5 sm:p-6 border-accent/30 bg-accent-soft/40">
          <h2 className="text-base font-semibold">What today&apos;s price assumes</h2>
          <p className="mt-2 text-sm leading-relaxed max-w-3xl">
            At {fmtMoney(company.market_cap)}, the market is pricing in{" "}
            <strong className="tnum">{fmtPct(implied)}</strong> annual free-cash-flow
            growth for the next decade (10% discount rate, 2.5% terminal growth).
            {histGrowth != null && (
              <>
                {" "}Over the last {m?.fcf_cagr_10y != null ? "ten" : "five"} years, FCF
                actually grew <strong className={`tnum ${pctColor(histGrowth)}`}>{fmtPct(histGrowth)}</strong>{" "}
                per year —{" "}
                {implied <= histGrowth * 0.7
                  ? "expectations look undemanding relative to history."
                  : implied <= histGrowth * 1.1
                    ? "expectations are roughly in line with history."
                    : "the price asks for acceleration beyond the historical record."}
              </>
            )}
          </p>
          {fv && company.shares_outstanding && (
            <p className="mt-3 text-xs text-muted tnum">
              Simple DCF per-share range:{" "}
              ${fmtNum((fv.low ?? 0) / company.shares_outstanding, 0)} ·{" "}
              ${fmtNum((fv.base ?? 0) / company.shares_outstanding, 0)} ·{" "}
              ${fmtNum((fv.high ?? 0) / company.shares_outstanding, 0)}{" "}
              (4% / base / optimistic growth). An estimate, not a target.
            </p>
          )}
          <p className="mt-2 text-xs text-faint">
            <Link href="/tools/reverse-dcf" className="underline underline-offset-2">
              Adjust the assumptions yourself →
            </Link>
          </p>
        </Card>
      )}

      {/* Growth snapshot */}
      <Section title="Growth record" subtitle="Compound annual growth rates from as-filed 10-K data, split-adjusted">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <Stat label="Rev 3y" value={fmtPctSigned(m?.rev_cagr_3y)} tone={(m?.rev_cagr_3y ?? 0) > 0 ? "positive" : "negative"} />
          <Stat label="Rev 5y" value={fmtPctSigned(m?.rev_cagr_5y)} tone={(m?.rev_cagr_5y ?? 0) > 0 ? "positive" : "negative"} />
          <Stat label="Rev 10y" value={fmtPctSigned(m?.rev_cagr_10y)} tone={(m?.rev_cagr_10y ?? 0) > 0 ? "positive" : "negative"} />
          <Stat label="EPS 5y" value={fmtPctSigned(m?.eps_cagr_5y)} tone={(m?.eps_cagr_5y ?? 0) > 0 ? "positive" : "negative"} />
          <Stat label="EPS 10y" value={fmtPctSigned(m?.eps_cagr_10y)} tone={(m?.eps_cagr_10y ?? 0) > 0 ? "positive" : "negative"} />
          <Stat label="FCF 5y" value={fmtPctSigned(m?.fcf_cagr_5y)} tone={(m?.fcf_cagr_5y ?? 0) > 0 ? "positive" : "negative"} />
          <Stat label="FCF 10y" value={fmtPctSigned(m?.fcf_cagr_10y)} tone={(m?.fcf_cagr_10y ?? 0) > 0 ? "positive" : "negative"} />
        </div>
      </Section>

      {/* Charts */}
      <Section title="Fundamentals" subtitle={`Fiscal ${years[0] ?? ""}–${years[years.length - 1] ?? ""}, from SEC filings`}>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
          <Card className="p-4">
            <BarSeries data={series("revenue")} formatY={(v) => fmtMoney(v)} title="Revenue" />
          </Card>
          <Card className="p-4">
            <BarSeries data={series("net_income")} formatY={(v) => fmtMoney(v)} title="Net income" />
          </Card>
          <Card className="p-4">
            <BarSeries data={series("fcf")} formatY={(v) => fmtMoney(v)} title="Free cash flow" />
          </Card>
          <Card className="p-4">
            <BarSeries data={series("shares_diluted")} formatY={(v) => fmtMoney(v, "")} title="Diluted shares (lower is better)" />
          </Card>
          <Card className="p-4 sm:col-span-2">
            <p className="text-xs font-medium text-muted mb-2">Margins</p>
            <LineChart series={marginSeries} labels={years} formatY={(v) => fmtPct(v, 0)} height={200} />
          </Card>
          <Card className="p-4">
            <BarSeries
              data={rows.map((r) => ({
                x: r.fiscal_year,
                y:
                  r.dividends_paid != null || r.buybacks != null
                    ? Math.abs(r.dividends_paid ?? 0) + Math.abs(r.buybacks ?? 0)
                    : null,
              }))}
              formatY={(v) => fmtMoney(v)}
              title="Capital returned (dividends + buybacks)"
            />
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted mb-2">Cash vs long-term debt</p>
            <LineChart
              series={[
                { name: "Cash", values: rows.map((r) => r.cash ?? null) },
                { name: "LT debt", values: rows.map((r) => r.lt_debt ?? null) },
              ]}
              labels={years}
              formatY={(v) => fmtMoney(v)}
              height={160}
              colors={["#0d9488", "#dc2626"]}
            />
          </Card>
        </div>
      </Section>

      {/* Quarterly */}
      {recentQ.length >= 4 && (
        <Section
          title="Quarterly"
          subtitle="Discrete quarters from 10-Q filings; Q4 derived as fiscal year minus Q1–Q3. Compare to the same quarter a year ago — most businesses are seasonal."
        >
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
            <Card className="p-4">
              <BarSeries
                data={recentQ.map((q) => ({ x: qLabel(q), y: q.revenue }))}
                formatY={(v) => fmtMoney(v)}
                title="Revenue by quarter"
                height={140}
              />
            </Card>
            <Card className="p-4">
              <BarSeries
                data={recentQ.map((q) => ({ x: qLabel(q), y: q.net_income }))}
                formatY={(v) => fmtMoney(v)}
                title="Net income by quarter"
                height={140}
              />
            </Card>
          </div>
          <div className="mt-4 overflow-x-auto border border-border rounded-xl bg-surface">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="text-left px-3 py-2 font-medium text-muted sticky left-0 bg-surface">Quarter</th>
                  <th className="px-3 py-2 font-medium text-muted">Revenue</th>
                  <th className="px-3 py-2 font-medium text-muted">YoY</th>
                  <th className="px-3 py-2 font-medium text-muted">Net income</th>
                  <th className="px-3 py-2 font-medium text-muted">YoY</th>
                  <th className="px-3 py-2 font-medium text-muted">EPS</th>
                </tr>
              </thead>
              <tbody>
                {[...recentQ].reverse().map((q) => {
                  const i = quarters.indexOf(q);
                  const revYoY = qYoY(quarters, i, "revenue");
                  const niYoY = qYoY(quarters, i, "net_income");
                  return (
                    <tr key={q.end_date} className="border-b border-border last:border-0 text-right tnum hover:bg-black/[0.02]">
                      <td className="text-left px-3 py-1.5 font-medium sticky left-0 bg-surface">
                        {qLabel(q)}
                        {q.derived && <span className="text-faint font-normal" title="Derived: FY − (Q1+Q2+Q3)"> *</span>}
                      </td>
                      <td className="px-3 py-1.5">{fmtMoney(q.revenue)}</td>
                      <td className={`px-3 py-1.5 ${pctColor(revYoY)}`}>{fmtPctSigned(revYoY)}</td>
                      <td className="px-3 py-1.5">{fmtMoney(q.net_income)}</td>
                      <td className={`px-3 py-1.5 ${pctColor(niYoY)}`}>{fmtPctSigned(niYoY)}</td>
                      <td className="px-3 py-1.5">{q.eps_diluted != null ? fmtNum(q.eps_diluted) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Track record */}
      <Section
        title="Track record"
        subtitle="Compound annual growth by period. For debt and share count, negative is the good direction."
      >
        <div className="overflow-x-auto border border-border rounded-xl bg-surface">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted">Series</th>
                {track.spans.map((s) => (
                  <th key={s} className="px-3 py-2 font-medium text-muted text-right">{s}y</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {track.series.map((s) => (
                <tr key={s.label} className="border-b border-border last:border-0 tnum">
                  <td className="text-left px-3 py-1.5">{s.label}</td>
                  {s.values.map((v, i) => (
                    <td
                      key={i}
                      className={`px-3 py-1.5 text-right ${
                        v == null
                          ? "text-faint"
                          : (s.better === "up" ? v > 0 : v < 0)
                            ? "text-positive"
                            : "text-negative"
                      }`}
                    >
                      {fmtPctSigned(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {track.invested.some((i) => i.stock != null && i.spy != null) && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {track.invested.map(
              (i) =>
                i.stock != null &&
                i.spy != null && (
                  <Card key={i.span} className="p-4">
                    <p className="text-[11px] uppercase tracking-wide text-faint">
                      $100, {i.span} years ago
                    </p>
                    <p className="text-lg font-semibold tnum mt-1">
                      ${fmtNum(i.stock, 0)}
                      <span className={`text-xs font-normal ml-1.5 ${i.stock >= i.spy ? "text-positive" : "text-negative"}`}>
                        vs ${fmtNum(i.spy, 0)} in SPY
                      </span>
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 tnum">
                      {fmtPct(i.stockCagr)} vs {fmtPct(i.spyCagr)}/yr
                    </p>
                  </Card>
                )
            )}
          </div>
        )}

        {dollarTest.some((d) => d.ratio != null) && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted mb-2">
              The $1 test — market value created per $1 of earnings retained
              (Buffett&apos;s hurdle: at least $1)
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {dollarTest.map(
                (d) =>
                  d.ratio != null && (
                    <Card key={d.span} className="p-4">
                      <p className="text-[11px] uppercase tracking-wide text-faint">
                        Last {d.span} years
                      </p>
                      <p className={`text-lg font-semibold tnum mt-1 ${d.ratio >= 1 ? "text-positive" : "text-negative"}`}>
                        ${fmtNum(d.ratio, 2)}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5 tnum">
                        {fmtMoney(d.valueCreated)} created / {fmtMoney(d.retained)} retained
                      </p>
                    </Card>
                  )
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Quality & capital discipline */}
      <Section title="Quality &amp; capital discipline" subtitle="Cash-based returns and how management deploys capital">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <Stat label="Cash ROIC" value={fmtPct(m?.roic_cfo)} sub="OCF ÷ (equity + debt)" />
          <Stat label="OCF / EV yield" value={fmtPct(m?.ocf_yield_ev)} />
          <Stat label="MC vs 10× OCF" value={m?.mc_vs_10x_ocf != null ? fmtNum(m.mc_vs_10x_ocf, 2) : "—"} sub="≤1 = priced under 10× OCF" />
          <Stat label="Debt / FCF" value={m?.debt_to_fcf != null ? `${fmtNum(m.debt_to_fcf, 1)}y` : "—"} />
          <Stat label="SBC / FCF" value={fmtPct(m?.sbc_to_fcf)} />
          <Stat
            label="Share count 5y"
            value={fmtPctSigned(m?.share_change_5y)}
            tone={(m?.share_change_5y ?? 0) < 0 ? "positive" : "negative"}
            sub="per year; negative = buybacks"
          />
          {!isFinancial && (
            <>
              <Stat label="Capital intensity" value={fmtPct(m?.ppne_to_revenue)} sub="net PP&E ÷ revenue" />
              <Stat
                label="Sales efficiency"
                value={m?.sales_efficiency != null ? `$${fmtNum(m.sales_efficiency, 2)}` : "—"}
                sub="new PP&E per $1 new revenue, 5y"
              />
            </>
          )}
        </div>

        {reinvest && reinvest.impliedGrowth != null && (
          <Card className="mt-4 p-4">
            <p className="text-sm">
              <span className="font-medium">Growth engine ({reinvest.span}y):</span>{" "}
              reinvested <span className="tnum">{fmtPct(reinvest.reinvestRate)}</span> of
              operating cash flow at an incremental return of{" "}
              <span className="tnum">{fmtPct(reinvest.incRoic)}</span> — an organically
              fundable growth rate of about{" "}
              <strong className="tnum">{fmtPct(reinvest.impliedGrowth)}</strong> per year
              (growth ≈ reinvestment rate × incremental ROIC).
            </p>
          </Card>
        )}
      </Section>

      {/* Red flags */}
      {(m?.red_flags?.length ?? 0) > 0 && (
        <Section id="flags" title="Red flags" subtitle="Mechanical checks — a flag is a question to investigate, not a verdict">
          <div className="grid sm:grid-cols-2 gap-3">
            {m!.red_flags.map((f) => (
              <Card key={f.id} className="p-4 border-warning/30">
                <p className="text-sm font-medium text-warning">{f.label}</p>
                <p className="text-xs text-muted mt-1 leading-relaxed">{f.detail}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Data table */}
      <Section title="Financial data" subtitle="As filed in 10-Ks; per-share figures split-adjusted. $ in millions.">
        <div className="overflow-x-auto border border-border rounded-xl bg-surface">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-right">
                <th className="text-left px-3 py-2 font-medium text-muted sticky left-0 bg-surface">FY</th>
                {["Revenue", "Gross profit", "Op income", "Net income", "EPS", "OCF", "CapEx", "FCF", "Dividends", "Buybacks", "SBC", "Cash", "LT debt", "Equity", "Shares"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => (
                <tr key={r.fiscal_year} className="border-b border-border last:border-0 text-right tnum hover:bg-black/[0.02]">
                  <td className="text-left px-3 py-1.5 font-medium sticky left-0 bg-surface">{r.fiscal_year}</td>
                  {[r.revenue, r.gross_profit, r.operating_income, r.net_income].map((v, i) => (
                    <td key={i} className="px-3 py-1.5">{v != null ? fmtNum(v / 1e6, 0) : "—"}</td>
                  ))}
                  <td className="px-3 py-1.5">{r.eps_diluted != null ? fmtNum(r.eps_diluted) : "—"}</td>
                  {[r.ocf, r.capex, r.fcf, r.dividends_paid, r.buybacks, r.sbc, r.cash, r.lt_debt, r.equity].map((v, i) => (
                    <td key={i} className="px-3 py-1.5">{v != null ? fmtNum(v / 1e6, 0) : "—"}</td>
                  ))}
                  <td className="px-3 py-1.5">{r.shares_diluted != null ? fmtNum(r.shares_diluted / 1e6, 0) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Some concepts are structurally absent for certain industries (banks report no
          gross profit or capex). Missing ≠ zero.
        </p>
      </Section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/compare?tickers=${company.ticker}`} className="text-sm text-accent hover:underline underline-offset-2">
          Compare with peers →
        </Link>
        <span className="text-border">·</span>
        <a
          href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=10-K&dateb=&owner=include&count=10`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:underline underline-offset-2"
        >
          10-K filings on EDGAR ↗
        </a>
      </div>
    </div>
  );
}
