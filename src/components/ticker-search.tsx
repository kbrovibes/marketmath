"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Hit = { ticker: string; name: string; sector: string | null };

export function TickerSearch({
  compact = false,
  autoFocus = false,
  onNavigate,
}: {
  compact?: boolean;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setHits(data.results ?? []);
          setSel(0);
          setOpen(true);
        }
      } catch {
        /* aborted */
      }
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(ticker: string) {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(`/company/${ticker}`);
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter") {
              const hit = hits[sel] ?? hits[0];
              if (hit) go(hit.ticker);
              else if (q.trim()) go(q.trim().toUpperCase());
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={compact ? "Search ticker…" : "Search a company or ticker (e.g. AAPL)"}
          className={`w-full bg-surface border border-border rounded-lg pl-9 pr-3 outline-none transition-shadow placeholder:text-faint focus:border-border-strong focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] ${
            compact ? "h-9 text-sm" : "h-12 text-base shadow-sm"
          }`}
        />
      </div>

      {open && hits.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {hits.map((h, i) => (
            <button
              key={h.ticker}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(h.ticker)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm ${
                i === sel ? "bg-accent-soft" : ""
              }`}
            >
              <span className="font-mono font-semibold w-14 shrink-0">{h.ticker}</span>
              <span className="truncate text-muted">{h.name}</span>
              {h.sector && (
                <span className="ml-auto hidden sm:block text-[11px] text-faint shrink-0">
                  {h.sector}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
