import { auth } from "@clerk/nextjs/server";

import { RecentInvoicesDataTable } from "@/components/dashboard/recent-invoices-data-table";
import { getDashboardData } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { userId } = await auth();
  const { invoices, fetchError, hasProfile } = await getDashboardData(userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Open balances and status from your invoices (newest first).
          </p>
        </div>
        {hasProfile && userId ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {fetchError ? (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          {fetchError}
        </div>
      ) : null}

      {!hasProfile && userId ? (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          No Supabase profile linked to this sign-in. Add a{" "}
          <span className="font-mono text-xs text-foreground">profiles</span> row
          with your Clerk user id in{" "}
          <span className="font-mono text-xs text-foreground">clerk_id</span>.
        </div>
      ) : null}

      <RecentInvoicesDataTable
        data={invoices}
        showResolveColumn={false}
        emptyMessage="No invoices yet. Invoices appear when your ingest pipeline or API creates them."
      />
    </div>
  );
}
