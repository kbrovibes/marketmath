import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { getMetric, METRICS } from "@/lib/learn-content";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return METRICS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getMetric(slug);
  if (!doc) return { title: "Metric" };
  return { title: doc.name, description: doc.oneLiner };
}

export default async function MetricPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getMetric(slug);
  if (!doc) notFound();

  const related = METRICS.filter(
    (m) => m.category === doc.category && m.slug !== doc.slug
  );

  return (
    <div className="py-8 max-w-3xl">
      <Link
        href="/learn"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Learn
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{doc.name}</h1>
        <Badge tone="accent">{doc.category}</Badge>
      </div>
      <p className="text-sm text-muted mt-1">{doc.oneLiner}</p>

      <Card className="mt-6 p-4 bg-black/[0.02]">
        <p className="text-[11px] uppercase tracking-wide text-faint font-medium mb-1.5">
          Formula
        </p>
        <p className="font-mono text-sm leading-relaxed">{doc.formula}</p>
      </Card>

      <div className="mt-8 space-y-7 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">
            Why it matters
          </h2>
          <p className="text-muted">{doc.why}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">
            What good looks like
          </h2>
          <p className="text-muted">{doc.goodBad}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold tracking-tight mb-2">Caveats</h2>
          <p className="text-muted">{doc.caveats}</p>
        </section>
      </div>

      {related.length > 0 && (
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-[11px] uppercase tracking-wide text-faint font-medium mb-2">
            More in {doc.category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {related.map((m) => (
              <Link
                key={m.slug}
                href={`/learn/metric/${m.slug}`}
                className="px-2.5 py-1 rounded-md border border-border text-xs text-muted hover:text-foreground hover:border-border-strong transition-colors"
              >
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
