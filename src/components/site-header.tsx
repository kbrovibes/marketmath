"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

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
        <div className="hidden sm:block w-56">
          <TickerSearch compact />
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 -mr-2 text-muted"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1">
          <div className="sm:hidden pb-2">
            <TickerSearch compact onNavigate={() => setOpen(false)} />
          </div>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="px-2 py-2 rounded-md text-sm text-foreground hover:bg-black/[0.03]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
