/** Compact money: 1.23T, 456.7B, 89.1M */
export function fmtMoney(n: number | null | undefined, currency = "$"): string {
  if (n == null || !isFinite(n)) return "—";
  if (n === 0) return `${currency}0`;
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1e12) return `${sign}${currency}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${currency}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${currency}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${currency}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${currency}${abs.toFixed(2)}`;
}

export function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** 0.234 -> 23.4% */
export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || !isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

/** Signed percent with minus sign typography */
export function fmtPctSigned(n: number | null | undefined, digits = 1): string {
  if (n == null || !isFinite(n)) return "—";
  const v = n * 100;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(digits)}%`;
}

export function fmtRatio(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return `${n.toFixed(digits)}×`;
}

export function pctColor(n: number | null | undefined): string {
  if (n == null || !isFinite(n) || n === 0) return "text-muted";
  return n > 0 ? "text-positive" : "text-negative";
}
