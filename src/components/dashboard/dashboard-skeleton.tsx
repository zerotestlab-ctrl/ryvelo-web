import { cn } from "@/lib/utils";

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)} aria-busy aria-label="Loading dashboard">
      <p className="text-sm text-muted-foreground">Loading…</p>
      <div className="animate-pulse space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full rounded-md bg-muted/70" />
        </div>
        <div className="h-24 w-full max-w-md rounded-xl bg-muted/50 lg:max-w-sm" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border/60 bg-card/50" />
        ))}
      </div>
      <div className="h-[260px] rounded-xl border border-border/60 bg-card/40" />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="h-64 rounded-xl border border-border/60 bg-card/40 xl:col-span-7" />
        <div className="h-64 rounded-xl border border-border/60 bg-card/40 xl:col-span-5" />
      </div>
      </div>
    </div>
  );
}
