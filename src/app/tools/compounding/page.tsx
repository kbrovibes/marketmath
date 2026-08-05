import type { Metadata } from "next";
import { CompoundingWidget } from "./widget";

export const metadata: Metadata = {
  title: "Compounding",
  description: "Terminal wealth at different growth rates over decades.",
};

export default function CompoundingPage() {
  return (
    <div className="py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Compounding</h1>
      <p className="text-sm text-muted mt-2 leading-relaxed">
        The case for caring about quality and valuation in one table: over long
        horizons, small differences in annual return compound into enormous
        differences in outcome. Formula: each year, wealth grows by the rate and the
        annual contribution is added.
      </p>
      <div className="mt-6">
        <CompoundingWidget />
      </div>
    </div>
  );
}
