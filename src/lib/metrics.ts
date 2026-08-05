/**
 * Derived metrics computed at ingest time from stored fundamentals + quote.
 * All rates are decimals (0.12 = 12%).
 */

import { buildChecklist, type Checklist } from "@/lib/checklist";

export type AnnualFundamentals = {
  fiscal_year: number;
  end_date: string;
  revenue: number | null;
  gross_profit: number | null;
  operating_income: number | null;
  net_income: number | null;
  eps_diluted: number | null;
  shares_diluted: number | null;
  ocf: number | null;
  capex: number | null;
  fcf: number | null;
  dividends_paid: number | null;
  buybacks: number | null;
  sbc: number | null;
  cash: number | null;
  lt_debt: number | null;
  equity: number | null;
  assets: number | null;
  liabilities: number | null;
  ppne?: number | null;
  rnd?: number | null;
  interest_expense?: number | null;
};

export type CompanyQuote = {
  price: number | null;
  market_cap: number | null;
  shares_outstanding: number | null;
};

export function cagr(first: number, last: number, years: number): number | null {
  if (years <= 0 || first <= 0 || last <= 0) return null;
  return Math.pow(last / first, 1 / years) - 1;
}

/** CAGR of a series over up to `span` years ending at the latest year. */
function seriesCagr(
  rows: AnnualFundamentals[],
  key: keyof AnnualFundamentals,
  span: number
): number | null {
  const usable = rows.filter((r) => typeof r[key] === "number" && (r[key] as number) !== 0);
  if (usable.length < 2) return null;
  const latest = usable[usable.length - 1];
  // closest year at least `span` back (not the earliest available)
  const candidates = usable.filter((r) => r.fiscal_year <= latest.fiscal_year - span);
  const base = candidates.length > 0 ? candidates[candidates.length - 1] : usable[0];
  const years = latest.fiscal_year - base.fiscal_year;
  if (years < Math.min(span, 3) - 1) return null;
  return cagr(base[key] as number, latest[key] as number, years);
}

function safeDiv(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/**
 * Reverse DCF: the FCF growth rate (first 10y, then terminal) implied by the
 * current market cap. Discount 10%, terminal growth 2.5%, 10y horizon.
 */
export function reverseDcfImpliedGrowth(
  marketCap: number,
  fcf: number,
  discount = 0.1,
  terminalGrowth = 0.025,
  years = 10
): number | null {
  if (fcf <= 0 || marketCap <= 0) return null;

  const pvAt = (g: number): number => {
    let pv = 0;
    let cash = fcf;
    for (let y = 1; y <= years; y++) {
      cash *= 1 + g;
      pv += cash / Math.pow(1 + discount, y);
    }
    const terminal = (cash * (1 + terminalGrowth)) / (discount - terminalGrowth);
    return pv + terminal / Math.pow(1 + discount, years);
  };

  let lo = -0.5;
  let hi = 1.0;
  if (pvAt(lo) > marketCap || pvAt(hi) < marketCap) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (pvAt(mid) < marketCap) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Intrinsic value estimate via simple 2-stage FCF DCF (per company, not advice). */
export function dcfValue(
  fcf: number,
  growth: number,
  discount = 0.1,
  terminalGrowth = 0.025,
  years = 10
): number | null {
  if (fcf <= 0 || discount <= terminalGrowth) return null;
  let pv = 0;
  let cash = fcf;
  for (let y = 1; y <= years; y++) {
    cash *= 1 + growth;
    pv += cash / Math.pow(1 + discount, y);
  }
  const terminal = (cash * (1 + terminalGrowth)) / (discount - terminalGrowth);
  return pv + terminal / Math.pow(1 + discount, years);
}

export type RedFlag = { id: string; label: string; detail: string };

export type Metrics = {
  // growth (CAGR)
  rev_cagr_3y: number | null;
  rev_cagr_5y: number | null;
  rev_cagr_10y: number | null;
  eps_cagr_5y: number | null;
  eps_cagr_10y: number | null;
  fcf_cagr_5y: number | null;
  fcf_cagr_10y: number | null;
  // latest-FY margins & returns
  gross_margin: number | null;
  op_margin: number | null;
  net_margin: number | null;
  fcf_margin: number | null;
  roe: number | null;
  roa: number | null;
  // balance-sheet & capital discipline
  debt_to_equity: number | null;
  debt_to_fcf: number | null;
  cash_to_debt: number | null;
  sbc_to_fcf: number | null;
  share_change_5y: number | null; // negative = buybacks shrinking count
  // owner earnings (Buffett): OCF − capex − SBC
  owner_earnings: number | null;
  p_owner_earnings: number | null;
  owner_earnings_yield: number | null;
  // valuation & yields
  pe: number | null;
  pfcf: number | null;
  ps: number | null;
  pb: number | null;
  earnings_yield: number | null;
  fcf_yield: number | null;
  dividend_yield: number | null;
  buyback_yield: number | null;
  shareholder_yield: number | null;
  payout_ratio_fcf: number | null;
  // cash-based returns & house anchors
  roic_cfo: number | null; // OCF / (equity + LT debt)
  ocf_yield_ev: number | null; // OCF / enterprise value
  mc_vs_10x_ocf: number | null; // market cap ÷ (10 × OCF); ≤1 = at or below 10× OCF
  sales_efficiency: number | null; // Δ net PP&E per $1 of Δ revenue, ~5y window
  ppne_to_revenue: number | null; // capital intensity
  // interpretation
  implied_fcf_growth: number | null; // reverse DCF
  lynch_class: string | null;
  quality: string | null;
  quality_score: number | null; // 0-100
  red_flags: RedFlag[];
  checklist: Checklist | null;
  years_of_data: number;
  latest_fy: number | null;
};

/**
 * XBRL facts are as-reported: share counts and EPS are not retroactively
 * split-adjusted in old filings. Detect >1.8x discontinuities in diluted
 * share count between adjacent years and back-adjust shares & EPS so
 * per-share series are comparable.
 */
export function splitAdjust(rowsAsc: AnnualFundamentals[]): AnnualFundamentals[] {
  const raw = rowsAsc.map((r) => r.shares_diluted);
  const rows = rowsAsc.map((r) => ({ ...r }));
  let factor = 1;
  for (let i = rows.length - 1; i > 0; i--) {
    const cur = raw[i];
    const prev = raw[i - 1];
    if (cur != null && prev != null && prev > 0) {
      const ratio = cur / prev;
      if (ratio > 1.8 || ratio < 1 / 1.8) factor *= ratio; // split boundary
    }
    if (factor !== 1) {
      const prevRow = rows[i - 1];
      if (prevRow.shares_diluted != null) prevRow.shares_diluted *= factor;
      if (prevRow.eps_diluted != null) prevRow.eps_diluted /= factor;
    }
  }
  return rows;
}

export function computeMetrics(
  rowsDesc: AnnualFundamentals[],
  quote: CompanyQuote
): Metrics {
  // work oldest -> newest, split-adjusted
  const rows = splitAdjust(
    [...rowsDesc].sort((a, b) => a.fiscal_year - b.fiscal_year)
  );
  const latest = rows[rows.length - 1] ?? null;
  const mcap = quote.market_cap;

  const revC3 = seriesCagr(rows, "revenue", 3);
  const revC5 = seriesCagr(rows, "revenue", 5);
  const revC10 = seriesCagr(rows, "revenue", 10);

  const m: Metrics = {
    rev_cagr_3y: revC3,
    rev_cagr_5y: revC5,
    rev_cagr_10y: revC10,
    eps_cagr_5y: seriesCagr(rows, "eps_diluted", 5),
    eps_cagr_10y: seriesCagr(rows, "eps_diluted", 10),
    fcf_cagr_5y: seriesCagr(rows, "fcf", 5),
    fcf_cagr_10y: seriesCagr(rows, "fcf", 10),
    gross_margin: safeDiv(latest?.gross_profit, latest?.revenue),
    op_margin: safeDiv(latest?.operating_income, latest?.revenue),
    net_margin: safeDiv(latest?.net_income, latest?.revenue),
    fcf_margin: safeDiv(latest?.fcf, latest?.revenue),
    roe: safeDiv(latest?.net_income, latest?.equity),
    roa: safeDiv(latest?.net_income, latest?.assets),
    debt_to_equity: safeDiv(latest?.lt_debt, latest?.equity),
    debt_to_fcf:
      latest?.fcf != null && latest.fcf > 0 ? safeDiv(latest?.lt_debt, latest?.fcf) : null,
    cash_to_debt: safeDiv(latest?.cash, latest?.lt_debt),
    sbc_to_fcf:
      latest?.fcf != null && latest.fcf > 0 ? safeDiv(latest?.sbc, latest?.fcf) : null,
    share_change_5y: null,
    roic_cfo:
      latest?.ocf != null && (latest.equity ?? 0) + (latest.lt_debt ?? 0) > 0
        ? latest.ocf / ((latest.equity ?? 0) + (latest.lt_debt ?? 0))
        : null,
    ocf_yield_ev: null,
    mc_vs_10x_ocf: null,
    sales_efficiency: null,
    ppne_to_revenue: safeDiv(latest?.ppne ?? null, latest?.revenue),
    owner_earnings:
      latest?.ocf != null
        ? latest.ocf - Math.abs(latest.capex ?? 0) - Math.abs(latest.sbc ?? 0)
        : null,
    p_owner_earnings: null,
    owner_earnings_yield: null,
    pe: null,
    pfcf: null,
    ps: null,
    pb: null,
    earnings_yield: null,
    fcf_yield: null,
    dividend_yield: null,
    buyback_yield: null,
    shareholder_yield: null,
    payout_ratio_fcf: null,
    implied_fcf_growth: null,
    lynch_class: null,
    quality: null,
    quality_score: null,
    red_flags: [],
    checklist: null,
    years_of_data: rows.length,
    latest_fy: latest?.fiscal_year ?? null,
  };

  // share count trajectory
  const shares = rows.filter((r) => r.shares_diluted != null);
  if (shares.length >= 2) {
    const last = shares[shares.length - 1];
    const base =
      shares.find((r) => r.fiscal_year <= last.fiscal_year - 5) ?? shares[0];
    const yrs = last.fiscal_year - base.fiscal_year;
    if (yrs >= 2)
      m.share_change_5y = cagr(base.shares_diluted!, last.shares_diluted!, yrs);
  }

  // valuation
  if (mcap != null && mcap > 0 && latest) {
    m.pe = latest.net_income && latest.net_income > 0 ? mcap / latest.net_income : null;
    m.pfcf = latest.fcf && latest.fcf > 0 ? mcap / latest.fcf : null;
    m.ps = safeDiv(mcap, latest.revenue);
    m.pb = latest.equity && latest.equity > 0 ? mcap / latest.equity : null;
    m.earnings_yield = safeDiv(latest.net_income, mcap);
    m.fcf_yield = latest.fcf != null ? latest.fcf / mcap : null;
    m.dividend_yield = safeDiv(Math.abs(latest.dividends_paid ?? 0), mcap);
    m.buyback_yield = safeDiv(Math.abs(latest.buybacks ?? 0), mcap);
    if (m.dividend_yield != null || m.buyback_yield != null)
      m.shareholder_yield = (m.dividend_yield ?? 0) + (m.buyback_yield ?? 0);
    if (latest.fcf && latest.fcf > 0)
      m.implied_fcf_growth = reverseDcfImpliedGrowth(mcap, latest.fcf);
    if (latest.ocf != null && latest.ocf > 0) {
      m.mc_vs_10x_ocf = mcap / (10 * latest.ocf);
      const ev = mcap + (latest.lt_debt ?? 0) - (latest.cash ?? 0);
      if (ev > 0) m.ocf_yield_ev = latest.ocf / ev;
    }
    if (m.owner_earnings != null) {
      if (m.owner_earnings > 0) m.p_owner_earnings = mcap / m.owner_earnings;
      m.owner_earnings_yield = m.owner_earnings / mcap;
    }
  }

  // Sales efficiency: capital added per $1 of new revenue over ~5 years
  {
    const usable = rows.filter((r) => r.ppne != null && r.revenue != null);
    if (usable.length >= 3) {
      const last = usable[usable.length - 1];
      const candidates = usable.filter((r) => r.fiscal_year <= last.fiscal_year - 5);
      const base = candidates.length > 0 ? candidates[candidates.length - 1] : usable[0];
      const dRev = (last.revenue ?? 0) - (base.revenue ?? 0);
      const dPpne = (last.ppne ?? 0) - (base.ppne ?? 0);
      if (dRev > 0) m.sales_efficiency = dPpne / dRev;
    }
  }
  if (latest?.fcf && latest.fcf > 0)
    m.payout_ratio_fcf =
      (Math.abs(latest.dividends_paid ?? 0) + Math.abs(latest.buybacks ?? 0)) /
      latest.fcf;

  // Peter Lynch style classification on revenue growth
  const g = revC5 ?? revC3;
  if (g != null) {
    m.lynch_class = g < 0.05 ? "Slow grower" : g < 0.12 ? "Stalwart" : "Fast grower";
  }

  // quality score: growth consistency, profitability, balance sheet, capital returns
  m.quality_score = qualityScore(rows, m);
  m.quality =
    m.quality_score == null
      ? null
      : m.quality_score >= 70
        ? "High"
        : m.quality_score >= 45
          ? "Medium"
          : "Low";

  m.red_flags = redFlags(rows, m);
  m.checklist = rows.length >= 4 ? buildChecklist(rows, m) : null;
  return m;
}

function qualityScore(rows: AnnualFundamentals[], m: Metrics): number | null {
  if (rows.length < 4) return null;
  let score = 0;

  // Profitability (30)
  if ((m.net_margin ?? 0) > 0.15) score += 15;
  else if ((m.net_margin ?? 0) > 0.08) score += 10;
  else if ((m.net_margin ?? 0) > 0.02) score += 5;
  if ((m.roe ?? 0) > 0.2) score += 15;
  else if ((m.roe ?? 0) > 0.12) score += 10;
  else if ((m.roe ?? 0) > 0.06) score += 5;

  // Growth (25)
  const g = m.rev_cagr_5y ?? m.rev_cagr_3y ?? 0;
  if (g > 0.1) score += 10;
  else if (g > 0.04) score += 7;
  else if (g > 0) score += 3;
  const fg = m.fcf_cagr_5y ?? 0;
  if (fg > 0.1) score += 15;
  else if (fg > 0.04) score += 10;
  else if (fg > 0) score += 5;

  // Consistency (20): profitable + FCF-positive years in last 10
  const recent = rows.slice(-10);
  const profitable = recent.filter((r) => (r.net_income ?? 0) > 0).length;
  const fcfPos = recent.filter((r) => (r.fcf ?? -1) > 0).length;
  score += Math.round((profitable / recent.length) * 10);
  score += Math.round((fcfPos / recent.length) * 10);

  // Balance sheet (15)
  const dfcf = m.debt_to_fcf;
  if (dfcf == null || dfcf < 2) score += 10;
  else if (dfcf < 4) score += 6;
  else if (dfcf < 6) score += 3;
  if ((m.cash_to_debt ?? 0) > 1) score += 5;

  // Capital discipline (10)
  if ((m.share_change_5y ?? 0) < 0) score += 5;
  if ((m.sbc_to_fcf ?? 1) < 0.15) score += 5;

  return Math.min(100, score);
}

function redFlags(rows: AnnualFundamentals[], m: Metrics): RedFlag[] {
  const flags: RedFlag[] = [];
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  if (!latest) return flags;

  if (latest.revenue != null && prev?.revenue != null && latest.revenue < prev.revenue * 0.97)
    flags.push({
      id: "rev_decline",
      label: "Revenue declining",
      detail: "Latest fiscal-year revenue fell more than 3% versus the prior year.",
    });
  if (latest.fcf != null && latest.fcf < 0)
    flags.push({
      id: "neg_fcf",
      label: "Negative free cash flow",
      detail: "Operating cash flow did not cover capital expenditures in the latest fiscal year.",
    });
  if (latest.net_income != null && latest.net_income < 0)
    flags.push({
      id: "unprofitable",
      label: "Net loss",
      detail: "The company reported a net loss in the latest fiscal year.",
    });
  if ((m.debt_to_fcf ?? 0) > 5)
    flags.push({
      id: "high_debt",
      label: "Heavy debt load",
      detail: "Long-term debt exceeds 5 years of free cash flow.",
    });
  if ((m.sbc_to_fcf ?? 0) > 0.3)
    flags.push({
      id: "high_sbc",
      label: "Heavy stock compensation",
      detail: "Stock-based compensation consumes more than 30% of free cash flow.",
    });
  if ((m.share_change_5y ?? 0) > 0.02)
    flags.push({
      id: "dilution",
      label: "Shareholder dilution",
      detail: "Diluted share count has grown by more than 2% per year over ~5 years.",
    });
  if ((m.payout_ratio_fcf ?? 0) > 1)
    flags.push({
      id: "overdistribution",
      label: "Distributions exceed FCF",
      detail: "Dividends plus buybacks exceeded free cash flow in the latest fiscal year.",
    });
  const grossNow = m.gross_margin;
  const grossOld =
    rows.length >= 4 ? safeDiv(rows[rows.length - 4].gross_profit, rows[rows.length - 4].revenue) : null;
  if (grossNow != null && grossOld != null && grossNow < grossOld - 0.05)
    flags.push({
      id: "margin_compression",
      label: "Margin compression",
      detail: "Gross margin has fallen by more than 5 points over the last three years.",
    });
  return flags;
}
