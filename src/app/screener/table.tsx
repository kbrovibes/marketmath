"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fmtMoney, fmtPct, fmtPctSigned, fmtRatio, fmtNum, pctColor } from "@/lib/format";
import { Badge } from "@/components/ui";

export type ScreenerRow = {
  ticker: string;
  name: string;
  sector: string | null;
  mcap: number | null;
  pe: number | null;
  pfcf: number | null;
  fcfYield: number | null;
  revCagr5: number | null;
  epsCagr5: number | null;
  roe: number | null;
  debtToFcf: number | null;
  shYield: number | null;
  shareChange5: number | null;
  impliedGrowth: number | null;
  quality: number | null;
  lynch: string | null;
  flags: number | null;
};

type Preset = {
  id: string;
  label: string;
  rules: string;
  fn: (r: ScreenerRow) => boolean;
};

const PRESETS: Preset[] = [
  { id: "all", label: "All", rules: "No filters.", fn: () => true },
  {
    id: "compounders",
    label: "Quality compounders",
    rules: "Quality ≥ 70 · Revenue CAGR 5y ≥ 5% · FCF yield > 0 · ≤ 1 red flag",
    fn: (r) =>
      (r.quality ?? 0) >= 70 &&
      (r.revCagr5 ?? 0) >= 0.05 &&
      (r.fcfYield ?? 0) > 0 &&
      (r.flags ?? 9) <= 1,
  },
  {
    id: "cheapcash",
    label: "Cheap cash flow",
    rules: "P/FCF ≤ 20 · FCF yield ≥ 5% · Quality ≥ 45",
    fn: (r) =>
      r.pfcf != null && r.pfcf <= 20 && (r.fcfYield ?? 0) >= 0.05 && (r.quality ?? 0) >= 45,
  },
  {
    id: "shareholder",
    label: "Shareholder yield",
    rules: "Dividends + buybacks ≥ 4% of market cap · shrinking share count",
    fn: (r) => (r.shYield ?? 0) >= 0.04 && (r.shareChange5 ?? 1) < 0,
  },
  {
    id: "fastgrowers",
    label: "Fast growers",
    rules: "Revenue CAGR 5y ≥ 12% · EPS growing · profitable",
    fn: (r) => (r.revCagr5 ?? 0) >= 0.12 && (r.epsCagr5 ?? -1) > 0 && (r.pe ?? 0) > 0,
  },
  {
    id: "lowexpectations",
    label: "Low expectations",
    rules: "Market-implied FCF growth ≤ 4% · Quality ≥ 60 (reverse DCF)",
    fn: (r) => r.impliedGrowth != null && r.impliedGrowth <= 0.04 && (r.quality ?? 0) >= 60,
  },
  {
    id: "cleansheet",
    label: "Clean sheet",
    rules: "Zero red flags · Quality ≥ 60",
    fn: (r) => r.flags === 0 && (r.quality ?? 0) >= 60,
  },
];

const COLUMNS: {
  key: keyof ScreenerRow;
  label: string;
  fmt: (r: ScreenerRow) => string;
  cls?: (r: ScreenerRow) => string;
  desc: string;
}[] = [
  { key: "mcap", label: "Mkt cap", fmt: (r) => fmtMoney(r.mcap), desc: "Market capitalization" },
  { key: "pe", label: "P/E", fmt: (r) => (r.pe != null ? fmtNum(r.pe, 1) : "—"), desc: "Price to trailing net income" },
  { key: "pfcf", label: "P/FCF", fmt: (r) => (r.pfcf != null ? fmtNum(r.pfcf, 1) : "—"), desc: "Price to free cash flow" },
  { key: "fcfYield", label: "FCF yld", fmt: (r) => fmtPct(r.fcfYield), desc: "Free cash flow / market cap" },
  { key: "revCagr5", label: "Rev 5y", fmt: (r) => fmtPctSigned(r.revCagr5), cls: (r) => pctColor(r.revCagr5), desc: "Revenue CAGR, 5 years" },
  { key: "epsCagr5", label: "EPS 5y", fmt: (r) => fmtPctSigned(r.epsCagr5), cls: (r) => pctColor(r.epsCagr5), desc: "Diluted EPS CAGR, 5 years" },
  { key: "roe", label: "ROE", fmt: (r) => fmtPct(r.roe), desc: "Net income / shareholder equity" },
  { key: "shYield", label: "Shldr yld", fmt: (r) => fmtPct(r.shYield), desc: "(Dividends + buybacks) / market cap" },
  { key: "impliedGrowth", label: "Implied g", fmt: (r) => fmtPctSigned(r.impliedGrowth), desc: "FCF growth implied by price (reverse DCF)" },
  { key: "quality", label: "Quality", fmt: (r) => (r.quality != null ? String(r.quality) : "—"), desc: "Composite quality score 0-100" },
  { key: "flags", label: "Flags", fmt: (r) => (r.flags != null ? String(r.flags) : "—"), cls: (r) => ((r.flags ?? 0) > 0 ? "text-warning" : "text-muted"), desc: "Red flag count" },
];

export function ScreenerTable({
  rows,
  sectors,
}: {
  rows: ScreenerRow[];
  sectors: string[];
}) {
  const [preset, setPreset] = useState("all");
  const [sector, setSector] = useState("");
  const [sortKey, setSortKey] = useState<keyof ScreenerRow>("mcap");
  const [sortDesc, setSortDesc] = useState(true);

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  const filtered = useMemo(() => {
    let out = rows.filter(activePreset.fn);
    if (sector) out = out.filter((r) => r.sector === sector);
    out.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDesc ? -cmp : cmp;
    });
    return out;
  }, [rows, activePreset, sector, sortKey, sortDesc]);

  function toggleSort(key: keyof ScreenerRow) {
    if (sortKey === key) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              preset === p.id
                ? "bg-foreground text-white border-foreground"
                : "border-border text-muted hover:border-border-strong hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-full text-xs border border-border bg-surface text-muted"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {preset !== "all" && (
        <p className="mt-3 text-xs text-muted bg-black/[0.03] border border-border rounded-lg px-3 py-2 inline-block">
          <span className="font-medium text-foreground">Rules:</span> {activePreset.rules}
        </p>
      )}

      <p className="mt-3 text-xs text-faint tnum">{filtered.length} matches</p>

      {/* Desktop table */}
      <div className="mt-2 hidden md:block overflow-x-auto border border-border rounded-xl bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="sticky left-0 bg-surface px-3 py-2.5 font-medium text-xs text-muted">
                Company
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  title={c.desc}
                  onClick={() => toggleSort(c.key)}
                  className={`px-3 py-2.5 font-medium text-xs cursor-pointer select-none whitespace-nowrap text-right hover:text-foreground ${
                    sortKey === c.key ? "text-foreground" : "text-muted"
                  }`}
                >
                  {c.label}
                  {sortKey === c.key && (sortDesc ? " ↓" : " ↑")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((r) => (
              <tr key={r.ticker} className="border-b border-border last:border-0 hover:bg-black/[0.02]">
                <td className="sticky left-0 bg-surface px-3 py-2">
                  <Link href={`/company/${r.ticker}`} className="flex items-baseline gap-2">
                    <span className="font-mono font-semibold">{r.ticker}</span>
                    <span className="text-xs text-faint truncate max-w-[16ch]">{r.name}</span>
                  </Link>
                </td>
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-2 text-right tnum whitespace-nowrap ${c.cls?.(r) ?? ""}`}
                  >
                    {c.fmt(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-2 md:hidden flex flex-col gap-2">
        {filtered.slice(0, 60).map((r) => (
          <Link
            key={r.ticker}
            href={`/company/${r.ticker}`}
            className="border border-border rounded-xl bg-surface p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-mono font-semibold">{r.ticker}</span>
                <span className="text-xs text-faint truncate">{r.name}</span>
              </div>
              <span className="text-sm tnum">{fmtMoney(r.mcap)}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-faint">P/FCF</p>
                <p className="tnum">{r.pfcf != null ? fmtNum(r.pfcf, 1) : "—"}</p>
              </div>
              <div>
                <p className="text-faint">Rev 5y</p>
                <p className={`tnum ${pctColor(r.revCagr5)}`}>{fmtPctSigned(r.revCagr5)}</p>
              </div>
              <div>
                <p className="text-faint">FCF yld</p>
                <p className="tnum">{fmtPct(r.fcfYield)}</p>
              </div>
              <div>
                <p className="text-faint">Quality</p>
                <p className="tnum">
                  {r.quality ?? "—"}
                  {(r.flags ?? 0) > 0 && <Badge tone="warning">{r.flags}</Badge>}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
