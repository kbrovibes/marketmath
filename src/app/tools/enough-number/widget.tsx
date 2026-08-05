"use client";

import { useMemo, useState } from "react";
import { fmtMoney } from "@/lib/format";
import { Card } from "@/components/ui";

function Field({
  label,
  value,
  onChange,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <div className="relative mt-1">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full h-10 bg-surface border border-border rounded-lg px-3 pr-8 text-sm tnum outline-none focus:border-border-strong"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function EnoughWidget() {
  const [salary, setSalary] = useState(300_000);
  const [assets, setAssets] = useState(500_000);
  const [savings, setSavings] = useState(50_000);
  const [taxRate, setTaxRate] = useState(40);
  const [returnRate, setReturnRate] = useState(8);
  const [ltcgRate, setLtcgRate] = useState(25);

  const result = useMemo(() => {
    const afterTaxSalary = salary * (1 - taxRate / 100);
    const netReturn = (returnRate / 100) * (1 - ltcgRate / 100);
    if (netReturn <= 0) return null;
    const enough = afterTaxSalary / netReturn;

    // years until current assets + savings compound past the target
    let w = assets;
    let years: number | null = 0;
    const target = () => enough; // salary growth omitted for clarity; adjust salary instead
    while (w < target() && years < 60) {
      w = w * (1 + returnRate / 100) + savings;
      years++;
    }
    if (years >= 60) years = null;

    return { afterTaxSalary, netReturn, enough, years };
  }, [salary, assets, savings, taxRate, returnRate, ltcgRate]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Annual salary ($)" value={salary} onChange={setSalary} step={10000} />
        <Field label="Current earning assets ($)" value={assets} onChange={setAssets} step={50000} />
        <Field label="Annual savings ($)" value={savings} onChange={setSavings} step={5000} />
        <Field label="Income tax rate" value={taxRate} onChange={setTaxRate} suffix="%" />
        <Field label="Expected portfolio return" value={returnRate} onChange={setReturnRate} suffix="%" />
        <Field label="Capital gains tax rate" value={ltcgRate} onChange={setLtcgRate} suffix="%" />
      </Card>

      {result && (
        <Card className="p-6 border-accent/30 bg-accent-soft/40">
          <p className="text-sm text-muted">Your enough number</p>
          <p className="text-4xl font-semibold tnum mt-1">{fmtMoney(result.enough)}</p>
          <p className="text-sm text-muted mt-3 leading-relaxed max-w-xl">
            A portfolio of this size, returning {returnRate}% (
            {(result.netReturn * 100).toFixed(1)}% after capital-gains tax), produces{" "}
            <span className="tnum">{fmtMoney(result.afterTaxSalary)}</span> a year —
            your current after-tax salary.
          </p>
          <p className="text-sm mt-3 tnum">
            {result.years === 0 ? (
              <span className="text-positive font-medium">You are already there.</span>
            ) : result.years != null ? (
              <>
                At your current savings rate you cross it in{" "}
                <strong>{result.years} years</strong>.
              </>
            ) : (
              <span className="text-muted">
                Not reachable within 60 years at these assumptions.
              </span>
            )}
          </p>
        </Card>
      )}
    </div>
  );
}
