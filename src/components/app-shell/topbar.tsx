"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { formatUsd } from "@/lib/format";

type TopBarProps = {
  rightSlot?: ReactNode;
  /** Cash recovered this calendar month (USD). Wired to live data later. */
  cashRecoveredThisMonth?: number;
};

export function TopBar({
  rightSlot,
  cashRecoveredThisMonth = 0,
}: TopBarProps) {
  const display = formatUsd(cashRecoveredThisMonth, 0);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 truncate text-sm">
          <span className="text-muted-foreground">
            Cash Recovered This Month:
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums tracking-tight",
              "text-accent"
            )}
          >
            {display}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-4">{rightSlot}</div>
    </header>
  );
}
