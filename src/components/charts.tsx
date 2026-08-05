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
  const max = Math.max(...vals, 0);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const zeroY = (max / range) * 100;
  const yTop = (v: number) => ((max - v) / range) * 100;

  // Axis reference lines: max, midpoint, and the zero line when negatives exist.
  const gridVals: number[] = [];
  if (max > 0) gridVals.push(max);
  const mid = (max + min) / 2;
  if (Math.abs(mid - max) / range > 0.15 && Math.abs(mid) / range > 0.08)
    gridVals.push(mid);
  if (min < 0) gridVals.push(min);

  return (
    <div>
      {title && <p className="text-xs font-medium text-muted mb-2">{title}</p>}
      <div className="relative" style={{ height }}>
        {gridVals.map((g) => (
          <div
            key={g}
            className="absolute left-0 right-0 border-t border-dashed border-border pointer-events-none"
            style={{ top: `${yTop(g)}%` }}
          >
            <span
              className={`absolute right-0 z-10 text-[9px] text-muted tnum leading-none px-1 py-0.5 rounded bg-[color:var(--surface)]/90 ${
                g < 0 ? "top-0.5" : "-top-3.5"
              }`}
            >
              {formatY(g)}
            </span>
          </div>
        ))}
        {min < 0 && (
          <div
            className="absolute left-0 right-0 border-t border-border-strong pointer-events-none"
            style={{ top: `${zeroY}%` }}
          />
        )}
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
      <div className="flex gap-[3px] mt-1.5">
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
  const [lo, hi] = niceScale(Math.min(...all), Math.max(...all));
  const W = 720;
  const H = height;
  const padL = 6;
  const padR = 6;
  const n = labels.length;
  const px = (i: number) => padL + (i / Math.max(n - 1, 1)) * (W - padL - padR);
  const py = (v: number) => H - 18 - ((v - lo) / (hi - lo)) * (H - 30);

  const gridVals = [lo + (hi - lo) * 0.05, (lo + hi) / 2, hi - (hi - lo) * 0.05];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {gridVals.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={py(g)} y2={py(g)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" />
            <text x={W - padR} y={py(g) - 4} textAnchor="end" fontSize="10" fill="var(--faint)" className="tnum">
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
