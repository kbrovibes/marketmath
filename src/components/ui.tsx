import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface border border-border rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  id,
  title,
  subtitle,
  children,
  right,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneCls =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : "";
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-faint font-medium">
        {label}
      </p>
      <p className={`text-lg font-semibold tnum tracking-tight mt-0.5 ${toneCls}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted mt-0.5 tnum">{sub}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "positive" | "negative" | "warning" | "accent" | "neutral";
}) {
  const cls = {
    positive: "bg-positive-soft text-positive border-positive/20",
    negative: "bg-negative-soft text-negative border-negative/20",
    warning: "bg-warning-soft text-warning border-warning/20",
    accent: "bg-accent-soft text-accent border-accent/20",
    neutral: "bg-black/[0.04] text-muted border-border",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
