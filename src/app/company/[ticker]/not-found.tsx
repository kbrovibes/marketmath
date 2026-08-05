import Link from "next/link";
import { TickerSearch } from "@/components/ticker-search";

export default function CompanyNotFound() {
  return (
    <div className="py-24 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not covered</h1>
      <p className="text-sm text-muted mt-2">
        This ticker isn&apos;t in the coverage universe (S&amp;P 500 constituents).
        Try another company.
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
