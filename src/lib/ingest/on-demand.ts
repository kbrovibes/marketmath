import { dbAdmin } from "@/lib/supabase";
import {
  fetchCompanyFacts,
  fetchTickerCikMap,
  latestSharesOutstanding,
  resolveAnnual,
} from "@/lib/ingest/sec";
import { fetchMonthly } from "@/lib/ingest/yahoo";
import { computeMetrics, AnnualFundamentals } from "@/lib/metrics";

const SEC_HEADERS = {
  "User-Agent": process.env.SEC_EDGAR_USER_AGENT ?? "MarketMath k4rthikr@gmail.com",
};

let tickerMap: Map<string, string> | null = null;
let tickerMapAt = 0;

async function cikFor(ticker: string): Promise<string | null> {
  if (!tickerMap || Date.now() - tickerMapAt > 24 * 3600 * 1000) {
    tickerMap = await fetchTickerCikMap();
    tickerMapAt = Date.now();
  }
  return tickerMap.get(ticker) ?? null;
}

/**
 * Ingest any US SEC filer on first request: fundamentals + prices + metrics.
 * Returns true if the ticker is now in the database. ~2-4s on first hit;
 * everything after reads from Supabase. Idempotent (upserts throughout).
 */
export async function ensureCompany(tickerRaw: string): Promise<boolean> {
  const ticker = tickerRaw.toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) return false;

  const db = dbAdmin();
  const { data: existing } = await db
    .from("mm_companies")
    .select("ticker")
    .eq("ticker", ticker)
    .maybeSingle();
  if (existing) return true;

  const cik = await cikFor(ticker);
  if (!cik) return false;

  // Metadata from the submissions API (name, SIC industry, exchange)
  let name = ticker;
  let sicDesc: string | null = null;
  let exchange: string | null = null;
  try {
    const res = await fetch(
      `https://data.sec.gov/submissions/CIK${cik.padStart(10, "0")}.json`,
      { headers: SEC_HEADERS }
    );
    if (res.ok) {
      const sub = await res.json();
      name = sub.name ?? ticker;
      sicDesc = sub.sicDescription ?? null;
      exchange = sub.exchanges?.[0] ?? null;
    }
  } catch {
    /* metadata is best-effort */
  }

  let rows: ReturnType<typeof resolveAnnual> = [];
  let shares: number | null = null;
  try {
    const cf = await fetchCompanyFacts(cik);
    rows = resolveAnnual(cf, 20);
    shares = latestSharesOutstanding(cf);
    if (cf.entityName) name = cf.entityName;
  } catch (e) {
    console.error(`on-demand ${ticker}: companyfacts failed:`, (e as Error).message);
    return false; // no XBRL facts -> nothing to show
  }
  if (rows.length === 0) return false;

  // Multi-class share structures can leave the dei cover-page count ambiguous;
  // fall back to the latest fiscal year's diluted weighted shares.
  if (shares == null) {
    const latestRow = rows.reduce((a, b) => (a.fiscal_year >= b.fiscal_year ? a : b));
    shares = (latestRow.values.shares_diluted as number | null) ?? null;
  }

  const { error: compErr } = await db.from("mm_companies").upsert(
    {
      ticker,
      cik,
      name,
      sub_industry: sicDesc,
      exchange,
      is_sp500: false,
      shares_outstanding: shares,
      fundamentals_updated_at: new Date().toISOString(),
    },
    { onConflict: "ticker" }
  );
  if (compErr) {
    console.error(`on-demand ${ticker}: company upsert failed:`, compErr.message);
    return false;
  }

  await db.from("mm_fundamentals_annual").upsert(
    rows.map((r) => ({
      ticker,
      fiscal_year: r.fiscal_year,
      end_date: r.end_date,
      ...r.values,
      source_tags: r.source_tags,
    })),
    { onConflict: "ticker,fiscal_year" }
  );

  let quotePrice: number | null = null;
  let marketCap: number | null = null;
  try {
    const { quote, monthly } = await fetchMonthly(ticker, 20);
    quotePrice = quote.price;
    marketCap = shares != null ? quote.price * shares : null;
    if (monthly.length > 0) {
      await db.from("mm_prices_monthly").upsert(
        monthly.map((p) => ({
          ticker,
          month: p.month,
          close: p.close,
          adj_close: p.adjClose,
        })),
        { onConflict: "ticker,month" }
      );
    }
    await db
      .from("mm_companies")
      .update({
        price: quote.price,
        week52_high: quote.week52High,
        week52_low: quote.week52Low,
        market_cap: marketCap,
        price_updated_at: new Date().toISOString(),
      })
      .eq("ticker", ticker);
  } catch {
    /* prices best-effort; fundamentals still render */
  }

  const metrics = computeMetrics(
    [...rows]
      .sort((a, b) => b.fiscal_year - a.fiscal_year)
      .map((r) => ({
        fiscal_year: r.fiscal_year,
        end_date: r.end_date,
        ...r.values,
      })) as AnnualFundamentals[],
    { price: quotePrice, market_cap: marketCap, shares_outstanding: shares }
  );
  await db.from("mm_metrics").upsert(
    { ticker, data: metrics, updated_at: new Date().toISOString() },
    { onConflict: "ticker" }
  );

  return true;
}
