import { computeMetrics, splitAdjust, AnnualFundamentals } from "../src/lib/metrics";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: rows } = await db
    .from("mm_fundamentals_annual")
    .select("*")
    .eq("ticker", "AAPL")
    .order("fiscal_year", { ascending: false });
  const { data: comp } = await db
    .from("mm_companies")
    .select("price,market_cap,shares_outstanding")
    .eq("ticker", "AAPL")
    .single();
  const m = computeMetrics(rows as AnnualFundamentals[], comp!);
  console.log(
    "rev5",
    m.rev_cagr_5y?.toFixed(4),
    "rev10",
    m.rev_cagr_10y?.toFixed(4),
    "eps10",
    m.eps_cagr_10y?.toFixed(4),
    "shrchg5",
    m.share_change_5y?.toFixed(4)
  );
  const adj = splitAdjust(
    [...(rows as AnnualFundamentals[])].sort((a, b) => a.fiscal_year - b.fiscal_year)
  );
  const r2011 = adj.find((r) => r.fiscal_year === 2011);
  console.log("2011 adj eps", r2011?.eps_diluted?.toFixed(3), "shares", (r2011?.shares_diluted ?? 0) / 1e9);
}
main();
