import { auth } from "@clerk/nextjs/server";

import { ProfileSetupRetry } from "@/components/auth/profile-setup-retry";
import { RecentInvoicesDataTable } from "@/components/dashboard/recent-invoices-data-table";
import { getDashboardData } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { userId } = await auth();
  const { invoices, fetchError, hasProfile, setupError } =
    await getDashboardData(userId);

  if (setupError) {
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
        </div>
        <ProfileSetupRetry reason={setupError} />
      </div>
    );
  }

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

      {!fetchError && invoices.length === 0 ? (
        <p className="rounded-lg border border-border/60 bg-card/30 px-4 py-3 text-sm text-muted-foreground">
          No invoices yet — use Upload Invoice on the Dashboard (file or paste JSON).
          Data is read directly from Supabase.
        </p>
      ) : null}

      <RecentInvoicesDataTable
        data={invoices}
        showResolveColumn={false}
        emptyMessage="No invoices yet. Data shown here is live from Supabase."
      />
    </div>
  );
}
