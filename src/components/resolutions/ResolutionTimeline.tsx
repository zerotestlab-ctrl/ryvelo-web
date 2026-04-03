"use client";

import { cn } from "@/lib/utils";
import type { ResolutionStep } from "@/lib/agents/types";

type Props = {
  steps: ResolutionStep[];
  className?: string;
};

function stepLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ResolutionTimeline({ steps, className }: Props) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No workflow steps recorded.</p>
    );
  }

  return (
    <div className={cn("relative pl-8", className)}>
      <div
        className="absolute bottom-2 left-[11px] top-2 w-px bg-border"
        aria-hidden
      />
      <ul className="space-y-0">
        {steps.map((s, idx) => {
          const ok = s.status === "success";
          const pending = s.status === "pending";
          const failed = s.status === "failed";
          return (
            <li key={`${s.step}-${s.timestamp}-${idx}`} className="relative pb-8 last:pb-0">
              <div
                className={cn(
                  "absolute left-[-22px] top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 bg-background ring-4 ring-card",
                  ok && "border-emerald-500/80",
                  pending && "border-amber-500/80",
                  failed && "border-red-500/70"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    ok && "bg-emerald-500",
                    pending && "bg-amber-500",
                    failed && "bg-red-500"
                  )}
                />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {stepLabel(s.step)}
                  </div>
                  <div className="mt-1 max-h-32 overflow-auto rounded-md border border-border/60 bg-black/20 p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {formatOutput(s.aiOutput)}
                  </div>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-right">
                  {formatTs(s.timestamp)}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatOutput(out: unknown): string {
  if (out === null || out === undefined) return "—";
  if (typeof out === "string") return out;
  try {
    return JSON.stringify(out, null, 2);
  } catch {
    return String(out);
  }
}
