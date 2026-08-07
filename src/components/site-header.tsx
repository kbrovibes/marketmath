"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TickerSearch } from "@/components/ticker-search";

const nav = [
  { href: "/screener", label: "Screener" },
  { href: "/compare", label: "Compare" },
  { href: "/tools", label: "Tools" },
  { href: "/sectors", label: "Sectors" },
  { href: "/learn", label: "Learn" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--background)]/85 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-6 h-6 rounded-md bg-foreground text-white grid place-items-center text-[11px] font-bold font-mono">
            M
          </span>
          <span className="font-semibold tracking-tight">MarketMath</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? "text-foreground bg-black/[0.05] font-medium"
                    : "text-muted hover:text-foreground hover:bg-black/[0.03]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />
        <div className="w-44 sm:w-56">
          <TickerSearch compact />
        </div>
      </div>
    </header>
  );
}
