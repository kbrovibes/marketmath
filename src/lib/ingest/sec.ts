/**
 * SEC EDGAR XBRL ingestion.
 * Facts semantics: `fy`/`fp` describe the filing, not the fact period —
 * fiscal years are derived from start/end dates and deduped by canonical
 * `frame` / latest `filed`.
 */

const SEC_HEADERS = {
  "User-Agent": process.env.SEC_EDGAR_USER_AGENT ?? "MarketMath k4rthikr@gmail.com",
  "Accept-Encoding": "gzip, deflate",
};

export type Fact = {
  start?: string;
  end: string;
  val: number;
  form: string;
  filed: string;
  frame?: string;
  fy?: number;
  fp?: string;
};

type CompanyFacts = {
  cik: number;
  entityName: string;
  facts: Record<string, Record<string, { units: Record<string, Fact[]> }>>;
};

export async function fetchCompanyFacts(cik: string): Promise<CompanyFacts> {
  const padded = cik.padStart(10, "0");
  const res = await fetch(
    `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`,
    { headers: SEC_HEADERS }
  );
  if (!res.ok) throw new Error(`SEC companyfacts ${cik}: ${res.status}`);
  return res.json();
}

export async function fetchTickerCikMap(): Promise<Map<string, string>> {
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: SEC_HEADERS,
  });
  if (!res.ok) throw new Error(`SEC tickers: ${res.status}`);
  const data: Record<string, { cik_str: number; ticker: string }> =
    await res.json();
  const map = new Map<string, string>();
  for (const row of Object.values(data)) map.set(row.ticker, String(row.cik_str));
  return map;
}

/** Fallback chains per concept — first tag with a fact for the year wins. */
export const TAG_CHAINS: Record<string, string[]> = {
  revenue: [
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "Revenues",
    "SalesRevenueNet",
    "RevenueFromContractWithCustomerIncludingAssessedTax",
    "RevenuesNetOfInterestExpense",
  ],
  gross_profit: ["GrossProfit"],
  operating_income: ["OperatingIncomeLoss"],
  net_income: [
    "NetIncomeLoss",
    "ProfitLoss",
    "NetIncomeLossAvailableToCommonStockholdersBasic",
  ],
  eps_diluted: ["EarningsPerShareDiluted", "EarningsPerShareBasicAndDiluted"],
  shares_diluted: [
    "WeightedAverageNumberOfDilutedSharesOutstanding",
    "WeightedAverageNumberOfSharesOutstandingBasic",
  ],
  ocf: [
    "NetCashProvidedByUsedInOperatingActivities",
    "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
  ],
  capex: [
    "PaymentsToAcquirePropertyPlantAndEquipment",
    "PaymentsToAcquireProductiveAssets",
    "PaymentsForCapitalImprovements",
  ],
  dividends_paid: [
    "PaymentsOfDividendsCommonStock",
    "PaymentsOfDividends",
    "DividendsCommonStockCash",
  ],
  buybacks: ["PaymentsForRepurchaseOfCommonStock"],
  sbc: ["ShareBasedCompensation", "AllocatedShareBasedCompensationExpense"],
  cash: [
    "CashAndCashEquivalentsAtCarryingValue",
    "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
  ],
  lt_debt: [
    "LongTermDebtNoncurrent",
    "LongTermDebt",
    "LongTermDebtAndCapitalLeaseObligations",
    "LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities",
  ],
  equity: [
    "StockholdersEquity",
    "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
  ],
  assets: ["Assets"],
  liabilities: ["Liabilities"],
  ppne: ["PropertyPlantAndEquipmentNet"],
  rnd: ["ResearchAndDevelopmentExpense"],
  interest_expense: [
    "InterestExpense",
    "InterestExpenseDebt",
    "InterestExpenseNonoperating",
  ],
};

const INSTANT_CONCEPTS = new Set([
  "cash",
  "lt_debt",
  "equity",
  "assets",
  "liabilities",
  "ppne",
]);

const ANNUAL_FORMS = new Set(["10-K", "10-K/A", "20-F", "20-F/A"]);

function factsFor(cf: CompanyFacts, tag: string): Fact[] {
  const node = cf.facts["us-gaap"]?.[tag];
  if (!node) return [];
  return Object.values(node.units).flat();
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

/** Fiscal year label = calendar year of period end (mid-year FYE keeps its end-year). */
function fiscalYearOf(end: string): number {
  return new Date(end).getUTCFullYear();
}

function pickCanonical(group: Fact[], year: number, instant: boolean): Fact {
  const canonical = group.find((f) =>
    instant ? f.frame?.startsWith(`CY${year}`) : f.frame === `CY${year}`
  );
  if (canonical) return canonical;
  return group.reduce((a, b) => (a.filed >= b.filed ? a : b));
}

export type AnnualRow = {
  fiscal_year: number;
  end_date: string;
  values: Record<string, number | null>;
  source_tags: Record<string, string>;
};

/**
 * Resolve one clean row per fiscal year across all concepts.
 * Duration concepts: 10-K facts with 330–380 day periods, grouped by end date.
 * Instant concepts: matched to the fiscal-year end dates found via durations.
 */
export function resolveAnnual(cf: CompanyFacts, maxYears = 20): AnnualRow[] {
  // Establish fiscal-year end dates from the most reliable duration concept
  const fyeByYear = new Map<number, string>();
  for (const concept of ["revenue", "net_income", "ocf"]) {
    for (const tag of TAG_CHAINS[concept]) {
      for (const f of factsFor(cf, tag)) {
        if (!f.start || !ANNUAL_FORMS.has(f.form)) continue;
        const d = daysBetween(f.start, f.end);
        if (d < 330 || d > 380) continue;
        const y = fiscalYearOf(f.end);
        const existing = fyeByYear.get(y);
        if (!existing || f.end > existing) fyeByYear.set(y, f.end);
      }
    }
    if (fyeByYear.size > 0) break;
  }

  const years = [...fyeByYear.keys()].sort((a, b) => b - a).slice(0, maxYears);
  const rows: AnnualRow[] = [];

  for (const year of years) {
    const endDate = fyeByYear.get(year)!;
    const values: Record<string, number | null> = {};
    const sourceTags: Record<string, string> = {};

    for (const [concept, chain] of Object.entries(TAG_CHAINS)) {
      const instant = INSTANT_CONCEPTS.has(concept);
      let resolved: Fact | null = null;
      let usedTag = "";

      for (const tag of chain) {
        const candidates = factsFor(cf, tag).filter((f) => {
          if (!ANNUAL_FORMS.has(f.form)) return false;
          if (instant) {
            return !f.start && f.end === endDate;
          }
          if (!f.start) return false;
          const d = daysBetween(f.start, f.end);
          return d >= 330 && d <= 380 && f.end === endDate;
        });
        if (candidates.length > 0) {
          resolved = pickCanonical(candidates, year, instant);
          usedTag = tag;
          break;
        }
      }

      values[concept] = resolved ? resolved.val : null;
      if (resolved) sourceTags[concept] = usedTag;
    }

    // Derived: FCF = OCF - CapEx (CapEx may be legitimately absent for financials)
    if (values.ocf != null) {
      values.fcf = values.ocf - (values.capex ?? 0);
    } else {
      values.fcf = null;
    }

    rows.push({ fiscal_year: year, end_date: endDate, values, source_tags: sourceTags });
  }

  return rows;
}

const QUARTERLY_CONCEPTS = ["revenue", "net_income", "eps_diluted"] as const;
const QUARTERLY_FORMS = new Set(["10-Q", "10-Q/A", "10-K", "10-K/A"]);

export type QuarterRow = {
  end_date: string;
  fiscal_year: number | null;
  fq: number | null;
  derived: boolean; // Q4 computed as FY − (Q1+Q2+Q3)
  values: Record<string, number | null>;
};

/**
 * Discrete quarterly values for revenue / net income / diluted EPS.
 * Uses ~90-day duration facts from 10-Qs (canonical `frame` preferred),
 * then derives Q4 from the annual totals since filers rarely report it
 * discretely. OCF is intentionally excluded (10-Qs report it year-to-date).
 */
export function resolveQuarterly(
  cf: CompanyFacts,
  annual: AnnualRow[],
  maxQuarters = 21
): QuarterRow[] {
  const byEnd = new Map<string, Record<string, number | null>>();

  for (const concept of QUARTERLY_CONCEPTS) {
    for (const tag of TAG_CHAINS[concept]) {
      const groups = new Map<string, Fact[]>();
      for (const f of factsFor(cf, tag)) {
        if (!f.start || !QUARTERLY_FORMS.has(f.form)) continue;
        const d = daysBetween(f.start, f.end);
        if (d < 80 || d > 100) continue;
        (groups.get(f.end) ?? groups.set(f.end, []).get(f.end)!).push(f);
      }
      for (const [end, group] of groups) {
        const row = byEnd.get(end) ?? {};
        if (row[concept] != null) continue; // first tag with data wins per end date
        const canonical =
          group.find((f) => /^CY\d{4}Q\d$/.test(f.frame ?? "")) ??
          group.reduce((a, b) => (a.filed >= b.filed ? a : b));
        row[concept] = canonical.val;
        byEnd.set(end, row);
      }
    }
  }

  const fyEnds = annual
    .map((a) => ({ fy: a.fiscal_year, end: a.end_date }))
    .sort((a, b) => a.end.localeCompare(b.end));

  const lastFy = fyEnds[fyEnds.length - 1];
  const rows: QuarterRow[] = [...byEnd.entries()]
    .map(([end, values]) => {
      const fye = fyEnds.find(
        (f) => f.end >= end && daysBetween(end, f.end) < 370
      );
      let fiscalYear: number | null = fye?.fy ?? null;
      let fq: number | null = null;
      if (fye) {
        fq = Math.min(4, Math.max(1, 4 - Math.round(daysBetween(end, fye.end) / 91)));
      } else if (lastFy && end > lastFy.end && daysBetween(lastFy.end, end) < 370) {
        // Quarters of the in-progress fiscal year (no 10-K filed yet)
        fiscalYear = lastFy.fy + 1;
        fq = Math.min(4, Math.max(1, Math.round(daysBetween(lastFy.end, end) / 91)));
      }
      return {
        end_date: end,
        fiscal_year: fiscalYear,
        fq,
        derived: false,
        values,
      };
    })
    .sort((a, b) => a.end_date.localeCompare(b.end_date));

  // Derive Q4 per fiscal year when Q1–Q3 are present and Q4 isn't
  for (const a of annual) {
    if (rows.some((r) => r.end_date === a.end_date)) continue;
    const qs = rows.filter((r) => r.fiscal_year === a.fiscal_year && !r.derived);
    if (qs.length !== 3) continue;
    const values: Record<string, number | null> = {};
    for (const concept of QUARTERLY_CONCEPTS) {
      const fy = a.values[concept];
      const parts = qs.map((q) => q.values[concept]);
      values[concept] =
        fy != null && parts.every((p) => p != null)
          ? fy - parts.reduce((s, p) => s! + p!, 0)!
          : null;
    }
    if (Object.values(values).every((v) => v == null)) continue;
    rows.push({
      end_date: a.end_date,
      fiscal_year: a.fiscal_year,
      fq: 4,
      derived: true,
      values,
    });
  }

  rows.sort((a, b) => a.end_date.localeCompare(b.end_date));
  return rows.slice(-maxQuarters);
}

/** Latest point-in-time shares outstanding (dei cover-page data). */
export function latestSharesOutstanding(cf: CompanyFacts): number | null {
  const node = cf.facts["dei"]?.["EntityCommonStockSharesOutstanding"];
  if (!node) return null;
  const facts = Object.values(node.units).flat();
  if (facts.length === 0) return null;
  return facts.reduce((a, b) => (a.end >= b.end ? a : b)).val;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
