export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recovery rate, aging curves, and resolution efficiency.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="text-sm font-semibold">Recovery trend</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Placeholder chart area (Week 2).
          </div>
          <div className="mt-4 h-56 rounded-lg border border-border bg-black/10" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">Aging mix</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Placeholder chart area (Week 2).
          </div>
          <div className="mt-4 h-56 rounded-lg border border-border bg-black/10" />
        </div>
      </div>
    </div>
  );
}

