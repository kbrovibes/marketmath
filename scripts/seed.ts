/**
 * Full seed: universe -> fundamentals -> prices -> metrics.
 * Run locally: npx tsx scripts/seed.ts [--limit N] [--tickers AAPL,MSFT] [--skip-fundamentals] [--skip-prices]
 */
import { createClient } from "@supabase/supabase-js";
import { fetchSp500 } from "../src/lib/ingest/universe";
import {
  fetchCompanyFacts,
  resolveAnnual,
  latestSharesOutstanding,
  sleep,
} from "../src/lib/ingest/sec";
import { fetchMonthly } from "../src/lib/ingest/yahoo";
import { computeMetrics, AnnualFundamentals } from "../src/lib/metrics";
import { readFileSync } from "fs";

// load .env.local
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? parseInt(args[limitArg + 1]) : Infinity;
const tickersArg = args.indexOf("--tickers");
const onlyTickers =
  tickersArg >= 0 ? new Set(args[tickersArg + 1].split(",")) : null;
const skipFundamentals = args.includes("--skip-fundamentals");
const skipPrices = args.includes("--skip-prices");

async function main() {
  console.log("1/4 universe…");
  const universe = await fetchSp500();
  console.log(`   parsed ${universe.length} S&P 500 constituents`);

  const { error: upErr } = await db.from("mm_companies").upsert(
    universe.map((u) => ({
      ticker: u.ticker,
      cik: u.cik,
      name: u.name,
      sector: u.sector,
      sub_industry: u.subIndustry,
    })),
    { onConflict: "ticker" }
  );
  if (upErr) throw new Error(`companies upsert: ${upErr.message}`);

  // SPY pseudo-company row for benchmark comparisons
  await db.from("mm_companies").upsert(
    {
      ticker: "SPY",
      cik: "0",
      name: "SPDR S&P 500 ETF (benchmark)",
      sector: null,
      is_sp500: false,
    },
    { onConflict: "ticker" }
  );

  let targets = universe.filter((u) => !onlyTickers || onlyTickers.has(u.ticker));
  targets = targets.slice(0, limit);
  if (!skipPrices)
    targets.push({ ticker: "SPY", name: "SPY", sector: "", subIndustry: "", cik: "0" });

  if (!skipFundamentals) {
    console.log(`2/4 fundamentals for ${targets.length} tickers (SEC, ~5/s)…`);
    let done = 0;
    for (const u of targets) {
      try {
        const cf = await fetchCompanyFacts(u.cik);
        const rows = resolveAnnual(cf, 20);
        if (rows.length > 0) {
          const { error } = await db.from("mm_fundamentals_annual").upsert(
            rows.map((r) => ({
              ticker: u.ticker,
              fiscal_year: r.fiscal_year,
              end_date: r.end_date,
              ...r.values,
              source_tags: r.source_tags,
            })),
            { onConflict: "ticker,fiscal_year" }
          );
          if (error) console.error(`   ${u.ticker}: db ${error.message}`);
        }
        // dei cover-page shares can be null/ambiguous for multi-class companies
        // (GOOGL, META…) — fall back to latest diluted weighted shares.
        let shares = latestSharesOutstanding(cf);
        if (shares == null && rows.length > 0) {
          const latestRow = rows.reduce((a, b) =>
            a.fiscal_year >= b.fiscal_year ? a : b
          );
          shares = (latestRow.values.shares_diluted as number | null) ?? null;
        }
        await db
          .from("mm_companies")
          .update({
            shares_outstanding: shares,
            fundamentals_updated_at: new Date().toISOString(),
          })
          .eq("ticker", u.ticker);
      } catch (e) {
        console.error(`   ${u.ticker}: ${(e as Error).message}`);
      }
      done++;
      if (done % 25 === 0) console.log(`   ${done}/${targets.length}`);
      await sleep(200);
    }
  }

  if (!skipPrices) {
    console.log(`3/4 prices for ${targets.length} tickers (Yahoo)…`);
    let done = 0;
    for (const u of targets) {
      try {
        const { quote, monthly } = await fetchMonthly(u.ticker, 20);
        if (monthly.length > 0) {
          const { error } = await db.from("mm_prices_monthly").upsert(
            monthly.map((p) => ({
              ticker: u.ticker,
              month: p.month,
              close: p.close,
              adj_close: p.adjClose,
            })),
            { onConflict: "ticker,month" }
          );
          if (error) console.error(`   ${u.ticker}: db ${error.message}`);
        }
        const { data: comp } = await db
          .from("mm_companies")
          .select("shares_outstanding")
          .eq("ticker", u.ticker)
          .single();
        await db
          .from("mm_companies")
          .update({
            price: quote.price,
            week52_high: quote.week52High,
            week52_low: quote.week52Low,
            market_cap:
              comp?.shares_outstanding != null
                ? quote.price * comp.shares_outstanding
                : null,
            price_updated_at: new Date().toISOString(),
          })
          .eq("ticker", u.ticker);
      } catch (e) {
        console.error(`   ${u.ticker}: ${(e as Error).message}`);
      }
      done++;
      if (done % 25 === 0) console.log(`   ${done}/${targets.length}`);
      await sleep(250);
    }
  }

  console.log("4/4 metrics…");
  for (const u of targets) {
    const { data: rows } = await db
      .from("mm_fundamentals_annual")
      .select("*")
      .eq("ticker", u.ticker)
      .order("fiscal_year", { ascending: false });
    const { data: comp } = await db
      .from("mm_companies")
      .select("price,market_cap,shares_outstanding")
      .eq("ticker", u.ticker)
      .single();
    if (!rows || rows.length === 0 || !comp) continue;
    const metrics = computeMetrics(rows as AnnualFundamentals[], comp);
    await db.from("mm_metrics").upsert(
      { ticker: u.ticker, data: metrics, updated_at: new Date().toISOString() },
      { onConflict: "ticker" }
    );
  }
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
