/* Lightweight server-renderable SVG charts. No client JS needed. */

type Pt = { x: string | number; y: number | null };

function niceScale(min: number, max: number): [number, number] {
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

/** Round tick values at 1/2/2.5/5 × 10^k steps, covering [min, max]. */
function niceTicks(min: number, max: number, target = 4): number[] {
  const range = max - min || Math.abs(max) || 1;
  const rough = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => range / s <= target) ??
    10 * mag;
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + step * 0.01; t += step) {
    ticks.push(Math.abs(t) < step * 1e-6 ? 0 : t);
  }
  return ticks;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = "var(--accent)",
  strokeWidth = 1.5,
}: {
  data: (number | null)[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const vals = data.filter((v): v is number => v != null && isFinite(v));
  if (vals.length < 2) return <svg width={width} height={height} />;
  const [lo, hi] = niceScale(Math.min(...vals), Math.max(...vals));
  const n = data.length;
  const px = (i: number) => (i / (n - 1)) * (width - 2) + 1;
  const py = (v: number) => height - 2 - ((v - lo) / (hi - lo)) * (height - 4);
  let d = "";
  data.forEach((v, i) => {
    if (v == null || !isFinite(v)) return;
    d += `${d ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Annual bar chart for a financial series (revenue, FCF, …).
 * Negative bars render below the zero line in the negative color.
 */
export function BarSeries({
  data,
  height = 160,
  formatY,
  title,
}: {
  data: Pt[];
  height?: number;
  formatY: (v: number) => string;
  title?: string;
}) {
  const vals = data.map((d) => d.y).filter((v): v is number => v != null && isFinite(v));
  if (vals.length === 0)
    return <div className="h-24 grid place-items-center text-xs text-faint">No data</div>;
  // Scale covers the data and all rounded tick values, so ticks never clip.
  const dataMax = Math.max(...vals, 0);
  const dataMin = Math.min(...vals, 0);
  const ticks = niceTicks(dataMin, dataMax);
  const max = Math.max(dataMax, ...ticks);
  const min = Math.min(dataMin, ...ticks);
  const range = max - min || 1;
  const zeroY = (max / range) * 100;
  const yTop = (v: number) => ((max - v) / range) * 100;

  return (
    <div>
      {title && <p className="text-xs font-medium text-muted mb-2">{title}</p>}
      <div className="flex">
        {/* Plot area */}
        <div className="relative flex-1" style={{ height }}>
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute left-0 right-0 border-t pointer-events-none ${
                t === 0 && min < 0
                  ? "border-border-strong"
                  : "border-dashed border-border"
              }`}
              style={{ top: `${yTop(t)}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-stretch gap-[3px]">
            {data.map((d, i) => {
              const v = d.y;
              if (v == null || !isFinite(v))
                return <div key={i} className="flex-1" />;
              const hPct = (Math.abs(v) / range) * 100;
              const topPct = v >= 0 ? zeroY - hPct : zeroY;
              return (
                <div key={i} className="flex-1 relative group min-w-0">
                  <div
                    className={`absolute left-0 right-0 rounded-[2px] ${
                      v >= 0 ? "bg-accent/75 group-hover:bg-accent" : "bg-negative/70"
                    } transition-colors`}
                    style={{ top: `${topPct}%`, height: `${Math.max(hPct, 0.75)}%` }}
                  />
                  <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10 tnum">
                    {d.x}: {formatY(v)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Y-axis gutter */}
        <div className="relative w-12 shrink-0" style={{ height }}>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute left-1.5 -translate-y-1/2 text-[10px] text-faint tnum leading-none"
              style={{ top: `${Math.min(Math.max(yTop(t), 4), 96)}%` }}
            >
              {formatY(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-[3px] mt-1.5 pr-12">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-faint tnum truncate">
            {i % Math.ceil(data.length / 6) === 0 ? String(d.x).slice(-2) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Multi-series indexed line chart (e.g. normalized compare). Client-free. */
export function LineChart({
  series,
  labels,
  height = 220,
  formatY,
  colors = ["#2563eb", "#0d9488", "#b45309", "#7c3aed", "#dc2626", "#475569"],
}: {
  series: { name: string; values: (number | null)[] }[];
  labels: (string | number)[];
  height?: number;
  formatY: (v: number) => string;
  colors?: string[];
}) {
  const all = series.flatMap((s) => s.values).filter((v): v is number => v != null && isFinite(v));
  if (all.length === 0)
    return <div className="h-24 grid place-items-center text-xs text-faint">No data</div>;
  const [scaleLo, scaleHi] = niceScale(Math.min(...all), Math.max(...all));
  const ticks = niceTicks(scaleLo, scaleHi);
  const lo = Math.min(scaleLo, ...ticks);
  const hi = Math.max(scaleHi, ...ticks);
  const W = 720;
  const H = height;
  const padL = 6;
  const padR = 52;
  const n = labels.length;
  const px = (i: number) => padL + (i / Math.max(n - 1, 1)) * (W - padL - padR);
  const py = (v: number) => H - 18 - ((v - lo) / (hi - lo)) * (H - 30);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {ticks.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={py(g)} y2={py(g)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" />
            <text x={W - padR + 8} y={py(g) + 3} textAnchor="start" fontSize="10" fill="var(--faint)" className="tnum">
              {formatY(g)}
            </text>
          </g>
        ))}
        {series.map((s, si) => {
          let d = "";
          s.values.forEach((v, i) => {
            if (v == null || !isFinite(v)) return;
            d += `${d ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`;
          });
          return (
            <path key={s.name} d={d} fill="none" stroke={colors[si % colors.length]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          );
        })}
        {labels.map((l, i) =>
          i % Math.ceil(n / 8) === 0 ? (
            <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--faint)" className="tnum">
              {String(l).slice(-2)}
            </text>
          ) : null
        )}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {series.map((s, si) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colors[si % colors.length] }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
