import Link from "next/link";
import type { Metadata } from "next";
import { Card, Section } from "@/components/ui";
import { GUIDES, METRICS, METRIC_CATEGORIES } from "@/lib/learn-content";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Guides to reading financial statements, valuation, and quality investing — plus a reference for every metric MarketMath computes.",
};

export default function LearnPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
      <p className="text-sm text-muted mt-1 max-w-2xl">
        Every number on this site is computed from SEC filings using a formula
        you can inspect. The guides below explain the frameworks — how to read
        a 10-K, what quality means, how price encodes expectations — and the
        reference covers each metric: its formula, why it matters, what good
        looks like, and when it misleads.
      </p>

      <div className="mt-8 space-y-10">
        <Section title="Guides" subtitle="Frameworks for using the metrics together">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GUIDES.map((g) => (
              <Link key={g.slug} href={`/learn/guide/${g.slug}`} className="group">
                <Card className="p-5 h-full transition-colors group-hover:border-border-strong">
                  <h3 className="font-semibold tracking-tight group-hover:text-accent transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-sm text-muted mt-1.5 leading-relaxed">
                    {g.summary}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          title="Metric reference"
          subtitle="Every metric MarketMath computes, grouped by what it measures"
        >
          <div className="space-y-6">
            {METRIC_CATEGORIES.map((cat) => {
              const docs = METRICS.filter((m) => m.category === cat);
              if (docs.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-xs uppercase tracking-wide text-faint font-medium mb-2">
                    {cat}
                  </h3>
                  <Card className="divide-y divide-border">
                    {docs.map((m) => (
                      <Link
                        key={m.slug}
                        href={`/learn/metric/${m.slug}`}
                        className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 px-4 py-2.5 hover:bg-black/[0.02] transition-colors"
                      >
                        <span className="text-sm font-medium shrink-0 sm:w-72">
                          {m.name}
                        </span>
                        <span className="text-sm text-muted leading-snug">
                          {m.oneLiner}
                        </span>
                      </Link>
                    ))}
                  </Card>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}
