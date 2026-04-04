"use client";

import type { ReactNode } from "react";

import { UpgradeSubscriptionButtons } from "@/components/subscription/upgrade-button";
import { cn } from "@/lib/utils";

import { formatUsd } from "@/lib/format";

type TopBarProps = {
  rightSlot?: ReactNode;
  /** Cash recovered this calendar month (USD). Wired to live data later. */
  cashRecoveredThisMonth?: number;
  /** From `profiles.subscription_plan` (e.g. Free, Starter, Pro). */
  planLabel?: string;
};

export function TopBar({
  rightSlot,
  cashRecoveredThisMonth = 0,
  planLabel,
}: TopBarProps) {
  const display = formatUsd(cashRecoveredThisMonth, 0);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
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

      <div className="flex min-w-0 shrink-0 items-center gap-2 pl-2 sm:gap-3">
        {planLabel ? (
          <span className="hidden max-w-[7rem] truncate text-xs text-muted-foreground sm:inline">
            Plan:{" "}
            <span className="font-semibold text-foreground">{planLabel}</span>
          </span>
        ) : null}
        <UpgradeSubscriptionButtons
          variant="compact"
          className="max-w-[min(100vw-8rem,420px)] justify-end"
        />
        {rightSlot}
      </div>
    </header>
  );
}
