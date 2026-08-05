export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-xs text-faint">
        <p>
          MarketMath — fundamentals from SEC filings. Educational use only; not
          investment advice.
        </p>
        <p className="tnum">Data: SEC EDGAR · Prices: delayed</p>
      </div>
    </footer>
  );
}
