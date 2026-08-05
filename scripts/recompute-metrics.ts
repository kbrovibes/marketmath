/** Recompute mm_metrics for given tickers (or all with --all). */
import { createClient } from "@supabase/supabase-js";
import { computeMetrics, AnnualFundamentals } from "../src/lib/metrics";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  let tickers: string[];
  if (process.argv[2] === "--all") {
    const { data } = await db.from("mm_companies").select("ticker").neq("ticker", "SPY");
    tickers = (data ?? []).map((r) => r.ticker);
  } else {
    tickers = process.argv[2].split(",");
  }
  for (const t of tickers) {
    const { data: rows } = await db
      .from("mm_fundamentals_annual")
      .select("*")
      .eq("ticker", t)
      .order("fiscal_year", { ascending: false });
    const { data: comp } = await db
      .from("mm_companies")
      .select("price,market_cap,shares_outstanding")
      .eq("ticker", t)
      .single();
    if (!rows || rows.length === 0 || !comp) {
      console.log(t, "skipped");
      continue;
    }
    const metrics = computeMetrics(rows as AnnualFundamentals[], comp);
    await db.from("mm_metrics").upsert(
      { ticker: t, data: metrics, updated_at: new Date().toISOString() },
      { onConflict: "ticker" }
    );
    console.log(t, "ok");
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
