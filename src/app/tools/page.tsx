import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Tools",
  description: "Valuation and planning calculators.",
};

const TOOLS = [
  {
    href: "/tools/reverse-dcf",
    title: "Reverse DCF",
    desc: "The growth rate today's price already assumes — the fastest way to see whether expectations are demanding or modest.",
    group: "Valuation",
  },
  {
    href: "/compare",
    title: "Compare",
    desc: "Indexed growth trajectories and capital efficiency across up to six companies.",
    group: "Valuation",
  },
  {
    href: "/screener",
    title: "Screener",
    desc: "Filter the S&P 500 with transparent, rule-based presets.",
    group: "Valuation",
  },
  {
    href: "/tools/compounding",
    title: "Compounding",
    desc: "What a portfolio becomes over decades at different growth rates — and what one extra point of return is worth.",
    group: "Planning",
  },
  {
    href: "/tools/enough-number",
    title: "Enough number",
    desc: "The asset level at which portfolio income replaces your salary, with every assumption on one screen.",
    group: "Planning",
  },
];

export default function ToolsPage() {
  const groups = [...new Set(TOOLS.map((t) => t.group))];
  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Tools</h1>
      <p className="text-sm text-muted mt-1">
        Small, transparent calculators. Every formula is stated — nothing is a black box.
      </p>
      {groups.map((g) => (
        <div key={g} className="mt-8">
          <h2 className="text-sm font-semibold text-muted mb-3">{g}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.filter((t) => t.group === g).map((t) => (
              <Link key={t.href} href={t.href}>
                <Card className="p-5 h-full hover:border-border-strong hover:shadow-sm transition-all">
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-sm text-muted mt-1.5 leading-relaxed">{t.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
