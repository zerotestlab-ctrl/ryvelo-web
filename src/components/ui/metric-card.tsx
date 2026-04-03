import * as React from "react";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface MetricCardProps {
  title: string;
  value: string;
  /** Optional footnote (e.g. period label) */
  footnote?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  footnote,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
        className
      )}
    >
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5 pt-0">
        <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </div>
        {footnote ? (
          <p className="mt-2 text-xs text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
