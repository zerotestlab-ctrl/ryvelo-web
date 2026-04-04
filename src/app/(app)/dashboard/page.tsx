import { auth } from "@clerk/nextjs/server";

import { CashVelocityChart } from "@/components/dashboard/cash-velocity-chart";
import { RecentInvoicesDataTable } from "@/components/dashboard/recent-invoices-data-table";
import { UploadTestInvoice } from "@/components/dashboard/upload-test-invoice";
import { SubscriptionUpgradeCta } from "@/components/subscription/upgrade-button";
import { MetricCard } from "@/components/ui/metric-card";
import { ResolutionTimeline } from "@/components/ui/resolution-timeline";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  const { invoices, resolutions, fetchError, hasProfile, metrics, subscriptionPlanLabel } =
    await getDashboardData(userId);

  const avgResolutionLabel =
    metrics.avgResolutionDays != null
      ? `${metrics.avgResolutionDays.toFixed(1)} days`
      : "—";
  const dsoLabel =
    metrics.dsoChangePercent != null
      ? `${metrics.dsoChangePercent >= 0 ? "+" : ""}${metrics.dsoChangePercent.toFixed(0)}%`
      : "—";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Cash recovered, resolution throughput, and open receivables.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Live metrics · Supabase
        </p>
      </div>

      {fetchError ? (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          Could not load live data: {fetchError}. Check Supabase env and
          service role key.
        </div>
      ) : null}

      {!hasProfile && userId ? (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          No Supabase profile linked to this sign-in. Add a{" "}
          <span className="font-mono text-xs text-foreground">profiles</span> row
          with your Clerk user id in{" "}
          <span className="font-mono text-xs text-foreground">clerk_id</span>{" "}
          before ingesting.
        </div>
      ) : null}

      <SubscriptionUpgradeCta planLabel={subscriptionPlanLabel} />

      <UploadTestInvoice />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Recovered This Month"
          value={formatUsd(metrics.totalRecoveredMtd, 0)}
          footnote="Month-to-date · settled to bank"
        />
        <MetricCard
          title="Avg Resolution Time"
          value={avgResolutionLabel}
          footnote="Rolling 30 days (created → resolved)"
        />
        <MetricCard
          title="Open Invoices"
          value={String(metrics.openInvoices)}
          footnote="Outstanding"
        />
        <MetricCard
          title="DSO This Month"
          value={dsoLabel}
          footnote="Invoice→resolved days vs. prior month (resolved only)"
        />
      </section>

      <CashVelocityChart data={metrics.cashVelocity} />

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Recent invoices
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Newest ingested first (live Supabase).
              </p>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {invoices.length} shown
            </span>
          </div>
          <RecentInvoicesDataTable
            data={invoices}
            emptyMessage="No invoices yet. Ingest an invoice on the dashboard to see it here."
          />
        </div>

        <div className="space-y-3 xl:col-span-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Recent resolutions
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Latest resolution activity (live Supabase).
            </p>
          </div>
          {resolutions.length > 0 ? (
            <ResolutionTimeline items={resolutions} />
          ) : (
            <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
              No resolutions yet. Ingest an invoice to create a resolution row.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
