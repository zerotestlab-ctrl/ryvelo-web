import * as React from "react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type ResolutionTimelineItem = {
  id: string;
  invoiceLabel: string;
  /** Short outcome label */
  outcome: string;
  outcomeVariant?: "success" | "warning" | "muted";
  /** Formatted recovered amount when resolved */
  recoveredLabel?: string;
  issues: string[];
  timestamp: string;
};

export interface ResolutionTimelineProps {
  items: ResolutionTimelineItem[];
  className?: string;
}

function outcomeBadgeVariant(
  v: ResolutionTimelineItem["outcomeVariant"]
): React.ComponentProps<typeof Badge>["variant"] {
  if (v === "success") return "success";
  if (v === "warning") return "warning";
  if (v === "muted") return "muted";
  return "secondary";
}

export function ResolutionTimeline({
  items,
  className,
}: ResolutionTimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, idx) => (
        <div key={item.id} className="relative flex gap-0">
          <div className="flex w-9 shrink-0 flex-col items-center">
            <div
              className={cn(
                "mt-2 h-2 w-2 rounded-full bg-accent ring-4 ring-background",
                idx === 0 && "mt-1.5"
              )}
            />
            {idx < items.length - 1 ? (
              <div className="mt-1 w-px flex-1 min-h-[24px] bg-border" />
            ) : null}
          </div>
          <Card className="mb-4 flex-1 border-border/80 bg-card/80 shadow-sm">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {item.invoiceLabel}
                  </span>
                  <Badge variant={outcomeBadgeVariant(item.outcomeVariant)}>
                    {item.outcome}
                  </Badge>
                  {item.recoveredLabel ? (
                    <span className="text-xs font-medium tabular-nums text-accent">
                      {item.recoveredLabel} recovered
                    </span>
                  ) : null}
                </div>
                <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                  {item.issues.map((issue, i) => (
                    <li key={`${item.id}-${i}`}>{issue}</li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-right">
                {item.timestamp}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
