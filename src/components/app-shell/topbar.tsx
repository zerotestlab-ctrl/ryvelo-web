"use client";

import type { ReactNode } from "react";

import { RyveloLogo } from "@/components/brand/ryvelo-logo";
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/55 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <RyveloLogo href="/dashboard" compact className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="hidden items-baseline gap-2 truncate text-sm sm:flex">
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
          <p className="truncate text-right text-[11px] text-muted-foreground sm:hidden">
            <span className="font-semibold tabular-nums text-accent">
              {display}
            </span>
            <span className="ml-1 opacity-80">recovered MTD</span>
          </p>
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
