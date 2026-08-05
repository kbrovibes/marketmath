import Link from "next/link";
import type { Metadata } from "next";
import { Card, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "How this app works",
  description:
    "Data sources, the offline computation pipeline, design choices, and the best alternative tools for fundamental analysis.",
};

const ALTERNATIVES: {
  name: string;
  url: string;
  domain: string;
  desc: string;
  free: string;
}[] = [
  {
    name: "Stock Analysis",
    url: "https://stockanalysis.com",
    domain: "stockanalysis.com",
    desc: "The best free general-purpose fundamentals site: clean statements, 10+ years of data, screener, and stock pages that load fast.",
    free: "Mostly free",
  },
  {
    name: "QuickFS",
    url: "https://quickfs.net",
    domain: "quickfs.net",
    desc: "20 years of financial statements in a dense grid — the fastest way to eyeball a full fundamental history. Loved by quality investors.",
    free: "Free tier",
  },
  {
    name: "TIKR",
    url: "https://tikr.com",
    domain: "tikr.com",
    desc: "Institutional-grade data (S&P Capital IQ) with estimates, transcripts, and global coverage at retail prices.",
    free: "Free tier",
  },
  {
    name: "Koyfin",
    url: "https://koyfin.com",
    domain: "koyfin.com",
    desc: "Bloomberg-style dashboards and charting across equities, macro, and funds. Strong for watching many things at once.",
    free: "Free tier",
  },
  {
    name: "Finchat (Fiscal.ai)",
    url: "https://fiscal.ai",
    domain: "fiscal.ai",
    desc: "Segment-level KPIs (e.g. AWS revenue, Apple Services) plus AI-assisted document search across filings and calls.",
    free: "Free tier",
  },
  {
    name: "GuruFocus",
    url: "https://www.gurufocus.com",
    domain: "gurufocus.com",
    desc: "Deep value-investing metrics (Piotroski, Altman, owner earnings) and 30-year histories. Dense but comprehensive.",
    free: "Paid, some free",
  },
  {
    name: "Morningstar",
    url: "https://www.morningstar.com",
    domain: "morningstar.com",
    desc: "Analyst-written fair value estimates and economic-moat ratings — a qualitative second opinion on quality.",
    free: "Paid, some free",
  },
  {
    name: "Dataroma",
    url: "https://www.dataroma.com",
    domain: "dataroma.com",
    desc: "What the superinvestors hold, from 13F filings. Idea sourcing from managers with real track records.",
    free: "Free",
  },
  {
    name: "Finviz",
    url: "https://finviz.com",
    domain: "finviz.com",
    desc: "The fastest broad-market screener and heatmaps. Better for wide sweeps than deep dives.",
    free: "Free tier",
  },
  {
    name: "SEC EDGAR full-text search",
    url: "https://efts.sec.gov/LATEST/search-index?q=",
    domain: "efts.sec.gov",
    desc: "The primary source itself — every 10-K, 10-Q, and proxy, searchable. Where every number on this site ultimately comes from.",
    free: "Free",
  },
];

function Flow({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="shrink-0 w-5 h-5 rounded-full bg-black/[0.06] grid place-items-center text-[10px] font-semibold tnum mt-0.5">
            {i + 1}
          </span>
          <span className="text-muted">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export default function AboutPage() {
  return (
    <div className="py-8 max-w-3xl flex flex-col gap-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">How this app works</h1>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          MarketMath is a fundamentals dashboard for the S&amp;P 500 built on primary
          sources. There is no proprietary feed and no black box: this page documents
          exactly where every number comes from, what is computed and when, and where
          this tool ends and other tools do a better job.
        </p>
      </div>

      <Section title="Data sources" subtitle="Three free, primary-ish sources; nothing scraped from other finance sites">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm font-semibold">SEC EDGAR (XBRL)</p>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              All fundamentals. Every US public company files structured financial
              data with the SEC; the <span className="font-mono">companyfacts</span>{" "}
              API exposes the full as-filed history. We pull up to 20 fiscal years per
              company from its 10-K filings — income statement, balance sheet, and
              cash-flow concepts.
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold">Yahoo Finance charts</p>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Prices only: the latest quote, 52-week range, and 20 years of monthly
              split-adjusted closes per ticker (plus SPY as the benchmark). Market cap
              is computed as price × latest SEC-reported share count, not taken from a
              vendor.
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold">Wikipedia S&amp;P 500 list</p>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              The coverage universe and GICS sector / sub-industry classification for
              each constituent, refreshed weekly. This also supplies the ticker→CIK
              mapping into EDGAR.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="The pipeline" subtitle="What happens offline, before you ever load a page">
        <Card className="p-5">
          <Flow
            steps={[
              "Ingest: a scheduled job fetches each company's raw XBRL facts from SEC EDGAR. Raw facts are messy — the same concept is tagged differently across companies and eras (revenue alone uses 5 different tags), and each figure appears up to 3 times as filings restate prior years.",
              "Resolve: for every company, concept, and fiscal year, a fallback chain picks the right tag, keeps only true annual periods (330–380 days from 10-K filings), and prefers the SEC's canonical entry — yielding one clean row per fiscal year: revenue, margins inputs, cash flows, capex, dividends, buybacks, stock compensation, debt, equity, PP&E, share counts.",
              "Adjust: as-filed per-share history is not split-adjusted (Apple's 2011 EPS shows as $27.68). Share-count discontinuities >1.8× are detected and older years are back-adjusted so per-share trends are comparable.",
              "Derive: from those rows plus the current quote, ~40 metrics are computed and stored — CAGRs over 3/5/10/15 years, margins, cash returns on capital, valuation multiples and yields, reverse-DCF implied growth, sales efficiency, the 0–100 quality score, the Lynch-style classification, and 8 mechanical red-flag checks.",
              "Serve: pages read only the precomputed database. Nothing is fetched from external APIs at page-view time, which is why pages are fast and the site keeps working even if a source has an outage.",
              "Refresh: prices update on weekday evenings; fundamentals refresh on a weekly rotation (each company re-ingested within ~7 days, which is plenty — 10-Ks arrive once a year).",
            ]}
          />
        </Card>
        <p className="mt-3 text-xs text-faint leading-relaxed">
          Interactive tools (reverse DCF sliders, compounding, enough number) compute
          in your browser from the same stored data — change an assumption and the
          math reruns instantly, with the formula stated on the page.
        </p>
      </Section>

      <Section title="What makes it different" subtitle="Deliberate design choices, and their costs">
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm font-semibold">Primary-source only</p>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Numbers come from what companies filed, not from a data vendor&apos;s
              adjustments. You can trace any figure to a 10-K (every company page
              links to its filings). The cost: no analyst estimates, no earnings
              calendar, no news.
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold">Expectations-first valuation</p>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Instead of pretending to know fair value, the headline question is
              inverted: what growth does today&apos;s price require, and is that
              plausible against the company&apos;s own record?
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold">No black boxes</p>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Every score, flag, and screener preset shows its rules and thresholds;
              the <Link href="/learn" className="text-accent hover:underline">Learn section</Link>{" "}
              documents each formula, including the quality score&apos;s exact
              component weights.
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold">Long horizon, small surface</p>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Annual data over decades, ~40 metrics that matter, no real-time
              anything. Built for judging businesses, not trading stocks. The cost: no
              quarterly granularity or intraday data — by design.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Honest limitations">
        <ul className="text-sm text-muted space-y-1.5 list-disc pl-5 leading-relaxed">
          <li>
            The seeded universe is the S&amp;P 500; any other US SEC filer is
            ingested live the first time someone opens its page (a few seconds).
            Foreign issuers without SEC XBRL filings and ETFs aren&apos;t covered.
            The screener and sector pages stay scoped to the S&amp;P 500.
          </li>
          <li>Annual data only; the latest quarter isn&apos;t reflected until the next 10-K.</li>
          <li>Banks and insurers: FCF, capex, gross margin and related metrics are structurally absent (shown as “—”), and cash-flow-based scores fit them poorly.</li>
          <li>Split adjustment is inferred from share-count jumps — accurate to a few percent, not exact.</li>
          <li>Prices are delayed and the market cap uses the latest reported share count, which lags by up to a quarter.</li>
        </ul>
      </Section>

      <Section
        title="Best alternatives"
        subtitle="Tools that do parts of this better, or cover what this site deliberately doesn't"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {ALTERNATIVES.map((a) => (
            <a key={a.name} href={a.url} target="_blank" rel="noopener noreferrer" className="group">
              <Card className="p-4 h-full transition-all group-hover:border-border-strong group-hover:shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold group-hover:text-accent transition-colors">
                    {a.name} ↗
                  </p>
                  <span className="text-[10px] text-faint shrink-0">{a.free}</span>
                </div>
                <p className="text-[11px] text-faint font-mono mt-0.5">{a.domain}</p>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">{a.desc}</p>
              </Card>
            </a>
          ))}
        </div>
      </Section>

      <p className="text-xs text-faint leading-relaxed border-t border-border pt-6">
        MarketMath is an educational project. Nothing here is investment advice, and
        data can contain errors — verify anything important against the filings.
        Stack: Next.js on Vercel, Supabase (Postgres), scheduled ingestion jobs.
      </p>
    </div>
  );
}
