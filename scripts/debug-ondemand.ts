import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

import {
  fetchCompanyFacts,
  fetchTickerCikMap,
  resolveAnnual,
} from "../src/lib/ingest/sec";

async function main() {
  const ticker = process.argv[2] ?? "ASTS";
  const map = await fetchTickerCikMap();
  const cik = map.get(ticker);
  console.log("cik:", cik);
  if (!cik) return;
  const cf = await fetchCompanyFacts(cik);
  console.log("entity:", cf.entityName);
  const tags = Object.keys(cf.facts["us-gaap"] ?? {});
  console.log("us-gaap tags:", tags.length);
  for (const probe of ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "NetIncomeLoss", "NetCashProvidedByUsedInOperatingActivities"]) {
    const node = cf.facts["us-gaap"]?.[probe];
    if (!node) {
      console.log(probe, ": MISSING");
      continue;
    }
    const facts = Object.values(node.units).flat();
    const annual = facts.filter((f) => f.form === "10-K" && f.start && (new Date(f.end).getTime() - new Date(f.start).getTime()) / 86400000 > 330);
    console.log(probe, ":", facts.length, "facts,", annual.length, "annual 10-K, forms:", [...new Set(facts.map((f) => f.form))].join(","));
  }
  const rows = resolveAnnual(cf, 20);
  console.log("resolved rows:", rows.length, rows.map((r) => r.fiscal_year).join(","));
}
main().catch((e) => console.error("ERR", e.message));
