import Link from "next/link";
import { TickerSearch } from "@/components/ticker-search";
import { db } from "@/lib/supabase";
import { fmtMoney, fmtPct } from "@/lib/format";
import { Card } from "@/components/ui";

export const revalidate = 3600;

async function getHighlights() {
  const client = db();
  const [{ data: largest }, { data: quality }, { count }] = await Promise.all([
    client
      .from("mm_companies")
      .select("ticker,name,sector,market_cap")
      .order("market_cap", { ascending: false, nullsFirst: false })
      .limit(6),
    client
      .from("mm_metrics")
      .select("ticker,data")
      .order("data->quality_score", { ascending: false })
      .limit(6),
    client.from("mm_companies").select("*", { count: "exact", head: true }),
  ]);
  return { largest: largest ?? [], quality: quality ?? [], count: count ?? 0 };
}

export default async function Home() {
  const { largest, quality, count } = await getHighlights();

  return (
    <div className="py-16 sm:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
          Know what you own.
        </h1>
        <p className="mt-4 text-muted text-lg">
          Twenty years of fundamentals from SEC filings, valuation math, and
          quality screens for {count || "500+"} S&amp;P 500 companies. No noise.
        </p>
        <div className="mt-8 max-w-md mx-auto">
          <TickerSearch autoFocus />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
          {["AAPL", "MSFT", "GOOGL", "COST", "V", "JNJ"].map((t) => (
            <Link
              key={t}
              href={`/company/${t}`}
              className="px-2.5 py-1 rounded-full border border-border text-muted hover:text-foreground hover:border-border-strong transition-colors font-mono"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 max-w-4xl mx-auto">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted">
            How it works — a 30-second example
          </h2>
          <span className="text-xs text-faint hidden sm:block">
            Tap any step to try it
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              href: "/company/COST",
              step: "1",
              title: "Pick a company",
              desc: "Say, Costco. Search any S&P 500 ticker or tap a chip above.",
              cta: "Open COST",
            },
            {
              href: "/company/COST",
              step: "2",
              title: "Scan the fundamentals",
              desc: "Twenty years of revenue, margins, ROIC, and a 0–100 quality score in one view.",
              cta: "See the numbers",
            },
            {
              href: "/tools/reverse-dcf?ticker=COST",
              step: "3",
              title: "Ask what the price assumes",
              desc: "Reverse DCF solves for the growth baked into today's price — then you judge if it's plausible.",
              cta: "Run reverse DCF",
            },
          ].map((s) => (
            <Link key={s.step} href={s.href}>
              <Card className="p-5 h-full hover:border-border-strong hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent-soft text-accent grid place-items-center text-xs font-semibold">
                    {s.step}
                  </span>
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                </div>
                <p className="text-sm text-muted mt-2 leading-relaxed">{s.desc}</p>
                <p className="text-xs text-accent font-medium mt-3">{s.cta} →</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {[
          {
            href: "/screener",
            title: "Screener",
            desc: "Filter the S&P 500 on growth, returns on capital, valuation, and quality.",
          },
          {
            href: "/tools/reverse-dcf",
            title: "Reverse DCF",
            desc: "See what growth the current price already assumes — then judge if it's plausible.",
          },
          {
            href: "/learn",
            title: "Learn",
            desc: "Every metric on this site, explained: what it means, how it's computed, when it misleads.",
          },
        ].map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="p-5 h-full hover:border-border-strong hover:shadow-sm transition-all">
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{c.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {(largest.length > 0 || quality.length > 0) && (
        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div>
            <h2 className="text-sm font-semibold text-muted mb-3">Largest companies</h2>
            <Card className="divide-y divide-border">
              {largest.map((c) => (
                <Link
                  key={c.ticker}
                  href={`/company/${c.ticker}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.02] transition-colors"
                >
                  <span className="font-mono font-semibold text-sm w-14">{c.ticker}</span>
                  <span className="text-sm text-muted truncate flex-1">{c.name}</span>
                  <span className="text-sm tnum">{fmtMoney(c.market_cap)}</span>
                </Link>
              ))}
            </Card>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-muted mb-3">Highest quality scores</h2>
            <Card className="divide-y divide-border">
              {quality.map((m) => (
                <Link
                  key={m.ticker}
                  href={`/company/${m.ticker}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.02] transition-colors"
                >
                  <span className="font-mono font-semibold text-sm w-14">{m.ticker}</span>
                  <span className="text-sm text-muted truncate flex-1">
                    {(m.data as { lynch_class?: string }).lynch_class ?? ""}
                  </span>
                  <span className="text-sm tnum">
                    {(m.data as { quality_score?: number }).quality_score}/100
                    {" · FCF "}
                    {fmtPct((m.data as { fcf_yield?: number }).fcf_yield ?? null)}
                  </span>
                </Link>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
