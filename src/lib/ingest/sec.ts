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
