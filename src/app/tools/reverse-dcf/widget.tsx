"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import { Card } from "@/components/ui";

function dcf(fcf: number, g: number, r: number, tg: number, years: number): number {
  let pv = 0;
  let cash = fcf;
  for (let y = 1; y <= years; y++) {
    cash *= 1 + g;
    pv += cash / Math.pow(1 + r, y);
  }
  return pv + (cash * (1 + tg)) / (r - tg) / Math.pow(1 + r, years);
}

function impliedGrowth(mcap: number, fcf: number, r: number, tg: number, years: number): number | null {
  if (fcf <= 0) return null;
  let lo = -0.5, hi = 1.0;
  if (dcf(fcf, lo, r, tg, years) > mcap || dcf(fcf, hi, r, tg, years) < mcap) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (dcf(fcf, mid, r, tg, years) < mcap) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  fmt,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-medium tnum">{fmt(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[color:var(--accent)]"
      />
    </label>
  );
}

export function ReverseDcfWidget(props: {
  ticker: string;
  name: string | null;
  marketCap: number | null;
  fcf: number | null;
  fcfYear: number | null;
  shares: number | null;
  price: number | null;
}) {
  const router = useRouter();
  const [tickerInput, setTickerInput] = useState(props.ticker);
  const [discount, setDiscount] = useState(0.1);
  const [terminal, setTerminal] = useState(0.025);
  const [years, setYears] = useState(10);
  const [growthGuess, setGrowthGuess] = useState(0.08);

  const implied = useMemo(
    () =>
      props.marketCap && props.fcf && props.fcf > 0
        ? impliedGrowth(props.marketCap, props.fcf, discount, terminal, years)
        : null,
    [props.marketCap, props.fcf, discount, terminal, years]
  );

  const fairValue = useMemo(
    () =>
      props.fcf && props.fcf > 0 && terminal < discount
        ? dcf(props.fcf, growthGuess, discount, terminal, years)
        : null,
    [props.fcf, growthGuess, discount, terminal, years]
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/tools/reverse-dcf?ticker=${encodeURIComponent(tickerInput.trim().toUpperCase())}`);
        }}
        className="flex gap-2 max-w-xs"
      >
        <input
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
          className="flex-1 h-10 bg-surface border border-border rounded-lg px-3 text-sm font-mono uppercase outline-none focus:border-border-strong"
          placeholder="Ticker"
        />
        <button className="h-10 px-4 rounded-lg bg-foreground text-white text-sm font-medium">
          Load
        </button>
      </form>

      {props.fcf == null || props.marketCap == null ? (
        <p className="text-sm text-muted">
          No free-cash-flow data for {props.ticker}. Try another ticker.
        </p>
      ) : props.fcf <= 0 ? (
        <p className="text-sm text-muted">
          {props.ticker} had negative free cash flow in FY{props.fcfYear} — a
          growth-implied-by-price calculation is not meaningful here.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Card className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-faint">Market cap</p>
              <p className="text-lg font-semibold tnum mt-0.5">{fmtMoney(props.marketCap)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-faint">
                FCF (FY{props.fcfYear})
              </p>
              <p className="text-lg font-semibold tnum mt-0.5">{fmtMoney(props.fcf)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-faint">Starting P/FCF</p>
              <p className="text-lg font-semibold tnum mt-0.5">
                {fmtNum(props.marketCap / props.fcf, 1)}×
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <div className="grid sm:grid-cols-3 gap-5">
              <Slider label="Discount rate" value={discount} onChange={setDiscount} min={0.06} max={0.15} step={0.005} fmt={(v) => fmtPct(v)} />
              <Slider label="Terminal growth" value={terminal} onChange={setTerminal} min={0} max={0.04} step={0.005} fmt={(v) => fmtPct(v)} />
              <Slider label="Growth years" value={years} onChange={setYears} min={5} max={15} step={1} fmt={(v) => `${v}y`} />
            </div>
          </Card>

          <Card className="p-6 border-accent/30 bg-accent-soft/40">
            <p className="text-sm text-muted">Growth the price requires</p>
            <p className="text-4xl font-semibold tnum mt-1">
              {implied != null ? fmtPct(implied) : "—"}
              <span className="text-base font-normal text-muted"> per year for {years} years</span>
            </p>
            <p className="text-xs text-muted mt-2 leading-relaxed max-w-xl">
              If {props.ticker} grows free cash flow slower than this, today&apos;s
              buyer underperforms the {fmtPct(discount)} discount rate. Compare it to
              the company&apos;s actual 5- and 10-year FCF growth on its company page.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium">Forward mode: your growth guess → value</p>
            <div className="mt-3 max-w-sm">
              <Slider label="Your FCF growth estimate" value={growthGuess} onChange={setGrowthGuess} min={-0.05} max={0.3} step={0.005} fmt={(v) => fmtPct(v)} />
            </div>
            {fairValue != null && (
              <p className="text-sm mt-3 tnum">
                Value: <strong>{fmtMoney(fairValue)}</strong>
                {props.shares && (
                  <>
                    {" "}(≈ <strong>${fmtNum(fairValue / props.shares, 0)}</strong>/share
                    {props.price != null && (
                      <span className={fairValue / props.shares >= props.price ? "text-positive" : "text-negative"}>
                        {" "}vs ${fmtNum(props.price, 0)} today
                      </span>
                    )}
                    )
                  </>
                )}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
