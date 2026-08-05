/**
 * Yahoo Finance v8 chart endpoint (unofficial). Browser UA required.
 * Isolated here so a breakage is contained; app reads only Supabase.
 */

// Note: fuller Chrome-style UA strings get 429'd; this minimal one passes.
const YAHOO_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

type ChartResponse = {
  chart: {
    result?: {
      meta: {
        regularMarketPrice: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        currency: string;
      };
      timestamp?: number[];
      indicators: {
        quote: { close: (number | null)[] }[];
        adjclose?: { adjclose: (number | null)[] }[];
      };
    }[];
    error?: { code: string; description: string };
  };
};

async function fetchChart(
  ticker: string,
  params: string,
  host = "query1"
): Promise<ChartResponse["chart"]["result"]> {
  const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?${params}`;
  const res = await fetch(url, { headers: { "User-Agent": YAHOO_UA } });
  if (res.status === 429 && host === "query1") {
    return fetchChart(ticker, params, "query2");
  }
  if (!res.ok) throw new Error(`Yahoo ${ticker}: ${res.status}`);
  const data: ChartResponse = await res.json();
  if (data.chart.error) throw new Error(`Yahoo ${ticker}: ${data.chart.error.code}`);
  return data.chart.result;
}

export type Quote = {
  price: number;
  week52High: number | null;
  week52Low: number | null;
};

export async function fetchQuote(ticker: string): Promise<Quote> {
  const result = await fetchChart(ticker, "range=1d&interval=1d");
  const meta = result![0].meta;
  return {
    price: meta.regularMarketPrice,
    week52High: meta.fiftyTwoWeekHigh ?? null,
    week52Low: meta.fiftyTwoWeekLow ?? null,
  };
}

export type MonthlyPrice = { month: string; close: number; adjClose: number };

/** Month-end closes for up to `years` back (uses 1mo interval). */
export async function fetchMonthly(
  ticker: string,
  years = 20
): Promise<{ quote: Quote; monthly: MonthlyPrice[] }> {
  const now = Math.floor(Date.now() / 1000);
  const start = now - years * 365.25 * 86400;
  const result = await fetchChart(
    ticker,
    `period1=${Math.floor(start)}&period2=${now}&interval=1mo`
  );
  const r = result![0];
  const ts = r.timestamp ?? [];
  const closes = r.indicators.quote[0]?.close ?? [];
  const adj = r.indicators.adjclose?.[0]?.adjclose ?? closes;

  const monthly: MonthlyPrice[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    const d = new Date(ts[i] * 1000);
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
    monthly.push({ month, close: c, adjClose: adj[i] ?? c });
  }
  // Dedup by month (Yahoo sometimes emits a partial current month twice)
  const byMonth = new Map(monthly.map((m) => [m.month, m]));
  return {
    quote: {
      price: r.meta.regularMarketPrice,
      week52High: r.meta.fiftyTwoWeekHigh ?? null,
      week52Low: r.meta.fiftyTwoWeekLow ?? null,
    },
    monthly: [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)),
  };
}
