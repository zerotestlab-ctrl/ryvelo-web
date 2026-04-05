export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 rounded-md bg-muted/40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border/40 bg-card/30" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border/40 bg-card/20" />
      <div className="grid gap-8 xl:grid-cols-12">
        <div className="h-80 rounded-xl border border-border/40 bg-card/20 xl:col-span-7" />
        <div className="h-80 rounded-xl border border-border/40 bg-card/20 xl:col-span-5" />
      </div>
    </div>
  );
}
