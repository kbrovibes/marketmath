"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompareInput({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const clean = value
          .toUpperCase()
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 6)
          .join(",");
        router.push(`/compare?tickers=${encodeURIComponent(clean)}`);
      }}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="AAPL, MSFT, GOOGL (max 6)"
        className="flex-1 h-10 bg-surface border border-border rounded-lg px-3 text-sm font-mono outline-none focus:border-border-strong focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
      />
      <button
        type="submit"
        className="h-10 px-4 rounded-lg bg-foreground text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Compare
      </button>
    </form>
  );
}
