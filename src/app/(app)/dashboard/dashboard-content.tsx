import { auth } from "@clerk/nextjs/server";

import { UploadInvoiceButton } from "@/components/dashboard/upload-invoice-button";
import { ProfileSetupRetry } from "@/components/auth/profile-setup-retry";
import { CashVelocityChart } from "@/components/dashboard/cash-velocity-chart";
import { RecentInvoicesDataTable } from "@/components/dashboard/recent-invoices-data-table";
import { SubscriptionUpgradeCta } from "@/components/subscription/upgrade-button";
import { MetricCard } from "@/components/ui/metric-card";
import { ResolutionTimeline } from "@/components/ui/resolution-timeline";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatUsd } from "@/lib/format";

export async function DashboardPageContent() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const {
    invoices,
    resolutions,
    fetchError,
    setupError,
    metrics,
    subscriptionPlanLabel,
  } = await getDashboardData(userId);

  if (setupError) {
    return <ProfileSetupRetry reason={setupError} />;
  }

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
      <div className="flex flex-col gap-6 border-b border-border/60 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Cash recovered, resolution throughput, and open receivables.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Live data · Supabase</p>
        </div>
        <div className="w-full shrink-0 lg:max-w-md lg:pt-0">
          <UploadInvoiceButton disabled={false} />
        </div>
      </div>

      {fetchError ? (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          {fetchError}
        </div>
      ) : null}

      {!fetchError &&
      invoices.length === 0 &&
      resolutions.length === 0 ? (
        <p className="rounded-lg border border-border/60 bg-card/30 px-4 py-3 text-sm text-muted-foreground">
          No data yet — upload an invoice to populate metrics and tables.
        </p>
      ) : null}

      <SubscriptionUpgradeCta planLabel={subscriptionPlanLabel} />

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
                Newest first · your Supabase data
              </p>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {invoices.length} shown
            </span>
          </div>
          <RecentInvoicesDataTable
            data={invoices}
            emptyMessage="No invoices yet. Upload an invoice file to get started."
          />
        </div>

        <div className="space-y-3 xl:col-span-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Recent resolutions
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Latest activity from your resolutions.
            </p>
          </div>
          {resolutions.length > 0 ? (
            <ResolutionTimeline items={resolutions} />
          ) : (
            <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
              No resolutions yet. They appear after invoices are imported.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
