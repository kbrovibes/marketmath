/**
 * Mechanical quality/valuation checklist computed from annual fundamentals +
 * derived metrics. Thresholds are explicit in each check; "na" means the
 * inputs are structurally missing (e.g. banks without gross profit or capex)
 * and the check is excluded from the score.
 */

import type { AnnualFundamentals, Metrics } from "@/lib/metrics";

export type CheckStatus = "pass" | "fail" | "na";

export type Check = {
  id: string;
  label: string;
  status: CheckStatus;
  value: string;
  threshold: string;
};

export type ChecklistCategory = {
  name: string;
  passed: number;
  total: number; // pass + fail (na excluded)
  checks: Check[];
};

export type Checklist = {
  score_pct: number | null;
  categories: ChecklistCategory[];
};

const pctStr = (v: number | null | undefined, digits = 1): string =>
  v == null ? "—" : `${(v * 100).toFixed(digits)}%`;

const numStr = (v: number | null | undefined, digits = 1): string =>
  v == null ? "—" : v.toFixed(digits);

function check(
  id: string,
  label: string,
  threshold: string,
  value: string,
  result: boolean | null
): Check {
  return {
    id,
    label,
    threshold,
    value,
    status: result == null ? "na" : result ? "pass" : "fail",
  };
}

export function buildChecklist(
  rowsAsc: AnnualFundamentals[],
  m: Metrics
): Checklist {
  const rows = rowsAsc;
  const latest = rows[rows.length - 1];
  const recent = rows.slice(-10);
  const enough10 = recent.length >= 6; // need a reasonable window for x-of-10 checks

  // ── Growth & Consistency ──────────────────────────────────────────────────
  const revUp = recent.filter(
    (r, i) =>
      i > 0 &&
      r.revenue != null &&
      recent[i - 1].revenue != null &&
      r.revenue > recent[i - 1].revenue!
  ).length;
  const fcfPos = recent.filter((r) => r.fcf != null && r.fcf > 0).length;
  const niPos = recent.filter((r) => r.net_income != null && r.net_income > 0).length;
  const ocfCagr = seriesGrowth(rows, "ocf");
  const revCagr = m.rev_cagr_5y;

  const growth: Check[] = [
    check(
      "rev_cagr",
      "Revenue growth",
      "5y CAGR ≥ 5%",
      pctStr(m.rev_cagr_5y),
      m.rev_cagr_5y == null ? null : m.rev_cagr_5y >= 0.05
    ),
    check(
      "eps_cagr",
      "EPS growth",
      "5y CAGR ≥ 5%",
      pctStr(m.eps_cagr_5y),
      m.eps_cagr_5y == null ? null : m.eps_cagr_5y >= 0.05
    ),
    check(
      "fcf_cagr",
      "FCF growth",
      "5y CAGR ≥ 5%",
      pctStr(m.fcf_cagr_5y),
      m.fcf_cagr_5y == null ? null : m.fcf_cagr_5y >= 0.05
    ),
    check(
      "rev_consistency",
      "Revenue rises consistently",
      "up in ≥ 7 of last 10 years",
      enough10 ? `${revUp} of ${recent.length - 1}` : "—",
      enough10 ? revUp >= Math.min(7, recent.length - 2) : null
    ),
    check(
      "fcf_consistency",
      "FCF consistently positive",
      "positive in ≥ 8 of last 10 years",
      enough10 ? `${fcfPos} of ${recent.length}` : "—",
      enough10 ? fcfPos >= Math.min(8, recent.length - 1) : null
    ),
    check(
      "ni_consistency",
      "Profitable every year",
      "net income > 0 in ≥ 8 of last 10",
      enough10 ? `${niPos} of ${recent.length}` : "—",
      enough10 ? niPos >= Math.min(8, recent.length - 1) : null
    ),
    check(
      "ocf_tracks_rev",
      "Cash flow keeps up with sales",
      "OCF CAGR ≥ 0.9× revenue CAGR",
      ocfCagr != null && revCagr != null
        ? `${pctStr(ocfCagr)} vs ${pctStr(revCagr)}`
        : "—",
      ocfCagr == null || revCagr == null ? null : ocfCagr >= revCagr * 0.9
    ),
  ];

  // ── Profitability ─────────────────────────────────────────────────────────
  const grossNow = m.gross_margin;
  const grossOld =
    rows.length >= 4
      ? ratio(rows[rows.length - 4].gross_profit, rows[rows.length - 4].revenue)
      : null;

  const profitability: Check[] = [
    check(
      "net_margin",
      "Net margin",
      "≥ 8%",
      pctStr(m.net_margin),
      m.net_margin == null ? null : m.net_margin >= 0.08
    ),
    check(
      "op_margin",
      "Operating margin",
      "≥ 10%",
      pctStr(m.op_margin),
      m.op_margin == null ? null : m.op_margin >= 0.1
    ),
    check(
      "gross_stable",
      "Gross margin stable or rising",
      "no drop > 2 pts over 3y",
      grossNow != null && grossOld != null
        ? `${pctStr(grossNow)} vs ${pctStr(grossOld)}`
        : "—",
      grossNow == null || grossOld == null ? null : grossNow >= grossOld - 0.02
    ),
    check(
      "roe",
      "Return on equity",
      "≥ 12%",
      pctStr(m.roe),
      m.roe == null ? null : m.roe >= 0.12
    ),
    check(
      "cash_roic",
      "Cash ROIC",
      "≥ 12%",
      pctStr(m.roic_cfo),
      m.roic_cfo == null ? null : m.roic_cfo >= 0.12
    ),
    check(
      "fcf_margin",
      "FCF margin",
      "≥ 5%",
      pctStr(m.fcf_margin),
      m.fcf_margin == null ? null : m.fcf_margin >= 0.05
    ),
    check(
      "earnings_quality",
      "Earnings back their cash",
      "OCF ≥ net income (latest FY)",
      latest?.ocf != null && latest?.net_income != null
        ? `OCF ${moneyish(latest.ocf)} vs NI ${moneyish(latest.net_income)}`
        : "—",
      latest?.ocf == null || latest?.net_income == null
        ? null
        : latest.ocf >= latest.net_income
    ),
  ];

  // ── Balance Sheet ─────────────────────────────────────────────────────────
  const equityRows = rows.filter((r) => r.equity != null);
  const eqLatest = equityRows[equityRows.length - 1];
  const eqBase =
    equityRows.filter((r) => r.fiscal_year <= (eqLatest?.fiscal_year ?? 0) - 5).pop() ??
    (equityRows.length >= 3 ? equityRows[0] : undefined);
  const hasDebt = (latest?.lt_debt ?? 0) > 0;

  const balance: Check[] = [
    check(
      "debt_to_fcf",
      "Debt payable from cash flow",
      "LT debt ≤ 3× FCF",
      m.debt_to_fcf != null ? `${numStr(m.debt_to_fcf)}y` : hasDebt ? "—" : "no debt",
      !hasDebt ? true : m.debt_to_fcf == null ? null : m.debt_to_fcf <= 3
    ),
    check(
      "cash_vs_debt",
      "Cash cushion",
      "cash ≥ 50% of LT debt",
      pctStr(m.cash_to_debt, 0),
      !hasDebt ? true : m.cash_to_debt == null ? null : m.cash_to_debt >= 0.5
    ),
    check(
      "debt_to_equity",
      "Leverage",
      "LT debt ≤ 1.5× equity",
      numStr(m.debt_to_equity, 2),
      !hasDebt ? true : m.debt_to_equity == null ? null : m.debt_to_equity <= 1.5
    ),
    check(
      "equity_growth",
      "Equity positive and compounding",
      "equity > 0 and grew over ~5y",
      eqLatest?.equity != null ? moneyish(eqLatest.equity) : "—",
      eqLatest?.equity == null || eqBase?.equity == null
        ? null
        : eqLatest.equity > 0 && eqLatest.equity > eqBase.equity
    ),
    check(
      "interest_burden",
      "Interest burden",
      "interest ≤ 15% of operating income",
      latest?.interest_expense != null && latest?.operating_income != null
        ? pctStr(ratio(latest.interest_expense, latest.operating_income), 0)
        : "—",
      latest?.interest_expense == null ||
        latest?.operating_income == null ||
        latest.operating_income <= 0
        ? null
        : latest.interest_expense <= 0.15 * latest.operating_income
    ),
  ];

  // ── Capital Allocation ────────────────────────────────────────────────────
  const bbYears = recent.filter((r) => (r.buybacks ?? 0) > 0).length;

  const capital: Check[] = [
    check(
      "share_count",
      "Share count flat or shrinking",
      "≤ +0.5%/yr over ~5y",
      pctStr(m.share_change_5y),
      m.share_change_5y == null ? null : m.share_change_5y <= 0.005
    ),
    check(
      "sbc",
      "Stock comp restrained",
      "SBC ≤ 15% of FCF",
      pctStr(m.sbc_to_fcf, 0),
      m.sbc_to_fcf == null ? null : m.sbc_to_fcf <= 0.15
    ),
    check(
      "payout",
      "Distributions funded by FCF",
      "dividends + buybacks ≤ 100% of FCF",
      pctStr(m.payout_ratio_fcf, 0),
      m.payout_ratio_fcf == null ? null : m.payout_ratio_fcf <= 1
    ),
    check(
      "buyback_habit",
      "Repurchases are a habit",
      "buybacks in ≥ 5 of last 10 years",
      enough10 ? `${bbYears} of ${recent.length}` : "—",
      enough10 ? bbYears >= Math.min(5, recent.length - 2) : null
    ),
  ];

  // ── Valuation Discipline ──────────────────────────────────────────────────
  const histFcfGrowth = m.fcf_cagr_10y ?? m.fcf_cagr_5y;

  const valuation: Check[] = [
    check(
      "fcf_yield",
      "FCF yield",
      "≥ 3%",
      pctStr(m.fcf_yield),
      m.fcf_yield == null ? null : m.fcf_yield >= 0.03
    ),
    check(
      "pe",
      "Earnings multiple",
      "P/E ≤ 25",
      numStr(m.pe),
      m.pe == null ? null : m.pe <= 25
    ),
    check(
      "implied_growth",
      "Price asks less than history delivered",
      "implied FCF growth ≤ historical FCF CAGR",
      m.implied_fcf_growth != null && histFcfGrowth != null
        ? `${pctStr(m.implied_fcf_growth)} vs ${pctStr(histFcfGrowth)}`
        : "—",
      m.implied_fcf_growth == null || histFcfGrowth == null
        ? null
        : m.implied_fcf_growth <= histFcfGrowth
    ),
    check(
      "shareholder_yield",
      "Shareholder yield",
      "dividends + buybacks ≥ 2% of market cap",
      pctStr(m.shareholder_yield),
      m.shareholder_yield == null ? null : m.shareholder_yield >= 0.02
    ),
  ];

  const categories: ChecklistCategory[] = [
    { name: "Growth & Consistency", checks: growth },
    { name: "Profitability", checks: profitability },
    { name: "Balance Sheet", checks: balance },
    { name: "Capital Allocation", checks: capital },
    { name: "Valuation Discipline", checks: valuation },
  ].map(({ name, checks }) => ({
    name,
    checks,
    passed: checks.filter((c) => c.status === "pass").length,
    total: checks.filter((c) => c.status !== "na").length,
  }));

  const passed = categories.reduce((s, c) => s + c.passed, 0);
  const total = categories.reduce((s, c) => s + c.total, 0);
  return {
    score_pct: total > 0 ? passed / total : null,
    categories,
  };
}

function ratio(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/** 5y-style CAGR for a raw fundamentals series (closest base ≥ 5y back). */
function seriesGrowth(
  rows: AnnualFundamentals[],
  key: "ocf"
): number | null {
  const usable = rows.filter((r) => r[key] != null && (r[key] as number) > 0);
  if (usable.length < 2) return null;
  const latest = usable[usable.length - 1];
  const candidates = usable.filter((r) => r.fiscal_year <= latest.fiscal_year - 5);
  const base = candidates.length > 0 ? candidates[candidates.length - 1] : usable[0];
  const years = latest.fiscal_year - base.fiscal_year;
  if (years < 2) return null;
  return Math.pow((latest[key] as number) / (base[key] as number), 1 / years) - 1;
}

/** Compact dollar figure for check values (no format.ts import to keep this lib standalone). */
function moneyish(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  return `${sign}$${abs.toFixed(0)}`;
}
