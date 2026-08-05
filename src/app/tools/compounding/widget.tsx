"use client";

import { useMemo, useState } from "react";
import { fmtMoney } from "@/lib/format";
import { Card } from "@/components/ui";

const RATES = [0.05, 0.07, 0.1, 0.12, 0.15];

function project(start: number, annual: number, rate: number, years: number): number {
  let w = start;
  for (let y = 0; y < years; y++) w = w * (1 + rate) + annual;
  return w;
}

function NumInput({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        value={value}
        min={0}
        step={step}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="mt-1 w-full h-10 bg-surface border border-border rounded-lg px-3 text-sm tnum outline-none focus:border-border-strong"
      />
    </label>
  );
}

export function CompoundingWidget() {
  const [start, setStart] = useState(100_000);
  const [annual, setAnnual] = useState(25_000);
  const [years, setYears] = useState(30);

  const rows = useMemo(
    () =>
      RATES.map((r) => ({
        rate: r,
        value: project(start, annual, r, years),
      })),
    [start, annual, years]
  );
  const base = rows[1].value; // 7%

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5 grid sm:grid-cols-3 gap-4">
        <NumInput label="Starting portfolio ($)" value={start} onChange={setStart} step={10000} />
        <NumInput label="Annual contribution ($)" value={annual} onChange={setAnnual} step={5000} />
        <NumInput label="Years" value={years} onChange={(v) => setYears(Math.min(60, v))} step={5} />
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-muted">Annual return</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted text-right">After {years} years</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted text-right">vs 7%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rate} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 tnum font-medium">{(r.rate * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 tnum text-right font-semibold">{fmtMoney(r.value)}</td>
                <td className={`px-4 py-2.5 tnum text-right ${r.value > base ? "text-positive" : "text-muted"}`}>
                  {r.value === base ? "—" : `${r.value > base ? "+" : "−"}${fmtMoney(Math.abs(r.value - base))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-faint leading-relaxed">
        Nominal figures; subtract ~2-3 points from returns to think in today&apos;s
        dollars. The gap between 7% and 12% is the entire argument for owning better
        businesses at sensible prices.
      </p>
    </div>
  );
}
