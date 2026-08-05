import { AnnualFundamentals, cagr } from "@/lib/metrics";

export type PriceRow = { month: string; adj_close: number | null };

function priceAt(prices: PriceRow[], yearsBack: number): number | null {
  if (prices.length === 0) return null;
  const lastDate = new Date(prices[prices.length - 1].month);
  const target = new Date(lastDate);
  target.setFullYear(target.getFullYear() - yearsBack);
  let best: PriceRow | null = null;
  for (const p of prices) {
    if (p.adj_close == null) continue;
    if (new Date(p.month) <= target) best = p;
    else break;
  }
  return best?.adj_close ?? null;
}

/** CAGR of a fundamentals series over `span` years (closest available base). */
function fCagr(
  rows: AnnualFundamentals[],
  key: keyof AnnualFundamentals,
  span: number
): number | null {
  const usable = rows.filter(
    (r) => typeof r[key] === "number" && (r[key] as number) > 0
  );
  if (usable.length < 2) return null;
  const latest = usable[usable.length - 1];
  const candidates = usable.filter((r) => r.fiscal_year <= latest.fiscal_year - span);
  if (candidates.length === 0) return null;
  const base = candidates[candidates.length - 1];
  return cagr(
    base[key] as number,
    latest[key] as number,
    latest.fiscal_year - base.fiscal_year
  );
}

export type TrackRecord = {
  spans: number[];
  series: { label: string; better: "up" | "down"; values: (number | null)[] }[];
  invested: {
    span: number;
    stock: number | null; // $100 grows to
    spy: number | null;
    stockCagr: number | null;
    spyCagr: number | null;
  }[];
};

export function buildTrackRecord(
  rows: AnnualFundamentals[],
  prices: PriceRow[],
  spyPrices: PriceRow[]
): TrackRecord {
  const spans = [3, 5, 10, 15];

  const priceCagr = (span: number): number | null => {
    const now = prices.length ? prices[prices.length - 1].adj_close : null;
    const past = priceAt(prices, span);
    if (now == null || past == null || past <= 0) return null;
    return cagr(past, now, span);
  };

  const series = [
    { label: "Revenue", better: "up" as const, values: spans.map((s) => fCagr(rows, "revenue", s)) },
    { label: "Operating cash flow", better: "up" as const, values: spans.map((s) => fCagr(rows, "ocf", s)) },
    { label: "Free cash flow", better: "up" as const, values: spans.map((s) => fCagr(rows, "fcf", s)) },
    { label: "EPS (diluted)", better: "up" as const, values: spans.map((s) => fCagr(rows, "eps_diluted", s)) },
    { label: "Equity", better: "up" as const, values: spans.map((s) => fCagr(rows, "equity", s)) },
    { label: "LT debt", better: "down" as const, values: spans.map((s) => fCagr(rows, "lt_debt", s)) },
    { label: "Diluted shares", better: "down" as const, values: spans.map((s) => fCagr(rows, "shares_diluted", s)) },
    { label: "Stock price", better: "up" as const, values: spans.map((s) => priceCagr(s)) },
  ];

  const invested = spans.map((span) => {
    const sNow = prices.length ? prices[prices.length - 1].adj_close : null;
    const sPast = priceAt(prices, span);
    const bNow = spyPrices.length ? spyPrices[spyPrices.length - 1].adj_close : null;
    const bPast = priceAt(spyPrices, span);
    const stock = sNow != null && sPast ? (sNow / sPast) * 100 : null;
    const spy = bNow != null && bPast ? (bNow / bPast) * 100 : null;
    return {
      span,
      stock,
      spy,
      stockCagr: sNow != null && sPast ? cagr(sPast, sNow, span) : null,
      spyCagr: bNow != null && bPast ? cagr(bPast, bNow, span) : null,
    };
  });

  return { spans, series, invested };
}

export type Reinvestment = {
  span: number;
  incRoic: number | null; // ΔOCF ÷ Δinvested capital
  reinvestRate: number | null; // Δinvested capital ÷ Σ OCF over window
  impliedGrowth: number | null; // incRoic × reinvestRate
} | null;

/**
 * Growth engine decomposition: g ≈ reinvestment rate × incremental return on
 * invested capital. Invested capital = LT debt + equity − cash.
 */
export function buildReinvestment(rows: AnnualFundamentals[], span = 5): Reinvestment {
  const ic = (r: AnnualFundamentals): number | null =>
    r.equity != null ? (r.lt_debt ?? 0) + r.equity - (r.cash ?? 0) : null;

  const usable = rows.filter((r) => r.ocf != null && ic(r) != null);
  if (usable.length < 3) return null;
  const latest = usable[usable.length - 1];
  const candidates = usable.filter((r) => r.fiscal_year <= latest.fiscal_year - span);
  if (candidates.length === 0) return null;
  const base = candidates[candidates.length - 1];

  const dOcf = latest.ocf! - base.ocf!;
  const dIc = ic(latest)! - ic(base)!;
  const window = usable.filter(
    (r) => r.fiscal_year > base.fiscal_year && r.fiscal_year <= latest.fiscal_year
  );
  const sumOcf = window.reduce((s, r) => s + (r.ocf ?? 0), 0);

  const incRoic = dIc > 0 ? dOcf / dIc : null;
  const reinvestRate = sumOcf > 0 ? dIc / sumOcf : null;
  return {
    span: latest.fiscal_year - base.fiscal_year,
    incRoic,
    reinvestRate,
    impliedGrowth:
      incRoic != null && reinvestRate != null && reinvestRate > 0
        ? incRoic * reinvestRate
        : null,
  };
}

export type DollarTest = {
  span: number;
  retained: number | null; // Σ (net income − dividends)
  valueCreated: number | null; // Δ market cap (year-end price × shares)
  ratio: number | null;
}[];

/**
 * Buffett's $1 test: every dollar of retained earnings should create at least
 * a dollar of market value. Market cap approximated with fiscal-year-end
 * monthly close × that year's diluted shares (unadjusted raw series pair).
 */
export function buildDollarTest(
  rawRows: AnnualFundamentals[],
  prices: PriceRow[]
): DollarTest {
  const priceNear = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    let best: number | null = null;
    let bestGap = Infinity;
    for (const p of prices) {
      if (p.adj_close == null) continue;
      const gap = Math.abs(new Date(p.month).getTime() - d.getTime());
      if (gap < bestGap) {
        bestGap = gap;
        best = p.adj_close;
      }
    }
    return bestGap < 100 * 86400000 ? best : null;
  };

  // Use raw (unadjusted) shares with unadjusted... prices are adjusted; shares raw.
  // To stay consistent, approximate mcap with adjusted price × split-adjusted shares:
  // caller must pass split-adjusted rows.
  const mcapAt = (r: AnnualFundamentals): number | null => {
    const p = priceNear(r.end_date);
    if (p == null || r.shares_diluted == null) return null;
    return p * r.shares_diluted;
  };

  return [5, 10].map((span) => {
    const latest = rawRows[rawRows.length - 1];
    if (!latest) return { span, retained: null, valueCreated: null, ratio: null };
    const baseCandidates = rawRows.filter(
      (r) => r.fiscal_year <= latest.fiscal_year - span
    );
    const base = baseCandidates[baseCandidates.length - 1];
    if (!base) return { span, retained: null, valueCreated: null, ratio: null };

    const window = rawRows.filter(
      (r) => r.fiscal_year > base.fiscal_year && r.fiscal_year <= latest.fiscal_year
    );
    let retained = 0;
    let ok = false;
    for (const r of window) {
      if (r.net_income != null) {
        retained += r.net_income - Math.abs(r.dividends_paid ?? 0);
        ok = true;
      }
    }
    const m0 = mcapAt(base);
    const m1 = mcapAt(latest);
    const valueCreated = m0 != null && m1 != null ? m1 - m0 : null;
    return {
      span,
      retained: ok ? retained : null,
      valueCreated,
      ratio:
        ok && retained > 0 && valueCreated != null ? valueCreated / retained : null,
    };
  });
}
