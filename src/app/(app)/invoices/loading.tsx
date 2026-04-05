export default function InvoicesLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading invoices">
      <p className="text-sm text-muted-foreground">Loading…</p>
      <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-md bg-muted/40" />
      <div className="h-72 rounded-xl border border-border/40 bg-card/20" />
      </div>
    </div>
  );
}
