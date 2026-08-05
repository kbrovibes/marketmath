import Link from "next/link";
import { TickerSearch } from "@/components/ticker-search";

export default function CompanyNotFound() {
  return (
    <div className="py-24 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-sm text-muted mt-2">
        We couldn&apos;t find this ticker among US SEC filers, or it has no usable
        XBRL filing history (very recent IPOs, foreign issuers, and ETFs aren&apos;t
        covered). Try another company.
      </p>
      <div className="mt-6">
        <TickerSearch />
      </div>
      <Link href="/screener" className="inline-block mt-4 text-sm text-accent hover:underline">
        Browse the screener →
      </Link>
    </div>
  );
}
