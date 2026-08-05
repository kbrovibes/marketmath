import type { Metadata } from "next";
import { EnoughWidget } from "./widget";

export const metadata: Metadata = {
  title: "Enough number",
  description:
    "The asset level at which portfolio income replaces your salary.",
};

export default function EnoughNumberPage() {
  return (
    <div className="py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Enough number</h1>
      <p className="text-sm text-muted mt-2 leading-relaxed">
        The point where work becomes optional: when your portfolio can sustainably
        produce what your salary produces after tax, additional labor income stops
        being a necessity. This calculator computes that asset level directly — no
        email gate, every assumption adjustable below.
      </p>
      <div className="mt-6">
        <EnoughWidget />
      </div>
      <p className="mt-8 text-xs text-faint leading-relaxed">
        Method: your after-tax salary is the income to replace. Portfolio income is
        the expected return net of capital-gains tax, applied to assets. Enough
        number = after-tax salary ÷ net portfolio return. The projection table shows
        when your current assets, compounding with annual savings, cross that line.
        Educational only — not financial advice.
      </p>
    </div>
  );
}
