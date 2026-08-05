import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { ReverseDcfWidget } from "./widget";

export const metadata: Metadata = {
  title: "Reverse DCF",
  description:
    "See the free-cash-flow growth rate the current price already assumes.",
};
export const revalidate = 3600;

type Props = { searchParams: Promise<{ ticker?: string }> };

export default async function ReverseDcfPage({ searchParams }: Props) {
  const { ticker: raw } = await searchParams;
  const ticker = (raw ?? "AAPL").toUpperCase();

  const client = db();
  const [{ data: company }, { data: latestRow }] = await Promise.all([
    client
      .from("mm_companies")
      .select("ticker,name,market_cap,shares_outstanding,price")
      .eq("ticker", ticker)
      .maybeSingle(),
    client
      .from("mm_fundamentals_annual")
      .select("fcf,fiscal_year")
      .eq("ticker", ticker)
      .order("fiscal_year", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Reverse DCF</h1>
      <p className="text-sm text-muted mt-2 leading-relaxed">
        A normal DCF asks “what is this worth, given my growth guess?” A reverse DCF
        asks the sharper question: <em>what growth does the current price already
        require?</em> If the required growth is far above what the business has ever
        delivered, you are paying for a future that has to be exceptional. If it is
        below the historical record, expectations are low.
      </p>

      <div className="mt-6">
        <ReverseDcfWidget
          ticker={company?.ticker ?? ticker}
          name={company?.name ?? null}
          marketCap={company?.market_cap ?? null}
          fcf={latestRow?.fcf ?? null}
          fcfYear={latestRow?.fiscal_year ?? null}
          shares={company?.shares_outstanding ?? null}
          price={company?.price ?? null}
        />
      </div>

      <div className="mt-8 text-xs text-faint leading-relaxed">
        <p>
          Model: 10-year two-stage DCF on free cash flow with a terminal value; equity
          value only (net debt ignored for simplicity). This is an expectations lens,
          not a price target.
        </p>
      </div>
    </div>
  );
}
