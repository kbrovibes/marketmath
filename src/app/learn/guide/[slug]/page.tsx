import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuide, GUIDES } from "@/lib/learn-content";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide" };
  return { title: guide.title, description: guide.summary };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <div className="py-8 max-w-3xl">
      <Link
        href="/learn"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Learn
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {guide.title}
      </h1>
      <p className="text-sm text-muted mt-1">{guide.summary}</p>

      <div className="mt-8 space-y-5">
        {guide.body.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted">
            {para}
          </p>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <p className="text-[11px] uppercase tracking-wide text-faint font-medium mb-2">
          More guides
        </p>
        <div className="flex flex-wrap gap-1.5">
          {others.map((g) => (
            <Link
              key={g.slug}
              href={`/learn/guide/${g.slug}`}
              className="px-2.5 py-1 rounded-md border border-border text-xs text-muted hover:text-foreground hover:border-border-strong transition-colors"
            >
              {g.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
