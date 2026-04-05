import {
  createSupabaseAdminClient,
  getProfileRowForClerkUser,
  isSupabaseEnvConfigured,
} from "@/lib/supabase/admin";
import { formatSubscriptionPlanLabel } from "@/lib/subscription";
import type { InvoiceRow } from "@/lib/data/invoice-types";
import type { ResolutionTimelineItem } from "@/components/ui/resolution-timeline";
import type { CashVelocityPoint } from "@/components/dashboard/cash-velocity-chart";
import { formatAmount } from "@/lib/format";

type DbInvoiceRow = {
  id: string;
  client_name: string | null;
  amount: string | number | null;
  currency: string | null;
  due_date: string | null;
  status: string | null;
  ingested_at: string | null;
  invoice_date: string | null;
};

type DbResolutionRow = {
  id: string;
  invoice_id: string;
  created_at: string | null;
  outcome_status: string | null;
  issues_detected: unknown;
  amount_recovered: string | number | null;
  resolved_at: string | null;
  human_reviewed: boolean | null;
};

type DbResolutionMetrics = {
  invoice_id: string;
  amount_recovered: string | number | null;
  resolved_at: string | null;
  created_at: string | null;
  outcome_status: string | null;
};

type DbInvoiceMetrics = {
  id: string;
  invoice_date: string | null;
  status: string | null;
};

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function addUtcMonths(d: Date, delta: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, d.getUTCDate(), 0, 0, 0, 0)
  );
}

function utcDayKey(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function buildMetrics(
  invoices: DbInvoiceMetrics[],
  resolutions: DbResolutionMetrics[]
): {
  totalRecoveredMtd: number;
  avgResolutionDays: number | null;
  openInvoices: number;
  dsoChangePercent: number | null;
  cashVelocity: CashVelocityPoint[];
} {
  const invById = new Map(invoices.map((i) => [i.id, i]));
  const now = new Date();
  const monthStart = startOfUtcMonth(now);
  const prevMonthStart = addUtcMonths(monthStart, -1);

  let totalRecoveredMtd = 0;
  for (const r of resolutions) {
    if (r.outcome_status !== "resolved" || !r.resolved_at) continue;
    const rt = new Date(r.resolved_at).getTime();
    if (rt < monthStart.getTime() || rt > now.getTime()) continue;
    const n = Number(r.amount_recovered ?? 0);
    if (!Number.isNaN(n)) totalRecoveredMtd += n;
  }

  const thirtyAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const resolutionDays: number[] = [];
  for (const r of resolutions) {
    if (r.outcome_status !== "resolved" || !r.resolved_at || !r.created_at) continue;
    const end = new Date(r.resolved_at).getTime();
    if (end < thirtyAgo) continue;
    const start = new Date(r.created_at).getTime();
    resolutionDays.push((end - start) / (24 * 60 * 60 * 1000));
  }
  const avgResolutionDays =
    resolutionDays.length > 0
      ? resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length
      : null;

  const openInvoices = invoices.filter(
    (i) => i.status !== "resolved" && i.status !== "failed"
  ).length;

  function avgInvoiceToResolvedDays(range: [Date, Date]): number | null {
    let sum = 0;
    let n = 0;
    for (const r of resolutions) {
      if (r.outcome_status !== "resolved" || !r.resolved_at) continue;
      const rt = new Date(r.resolved_at).getTime();
      if (rt < range[0].getTime() || rt >= range[1].getTime()) continue;
      const inv = invById.get(r.invoice_id);
      const idate = inv?.invoice_date;
      if (!idate) continue;
      const it = new Date(idate).getTime();
      sum += (rt - it) / (24 * 60 * 60 * 1000);
      n += 1;
    }
    return n > 0 ? sum / n : null;
  }

  const thisMonthCycle = avgInvoiceToResolvedDays([monthStart, new Date(now.getTime() + 1)]);
  const lastMonthCycle = avgInvoiceToResolvedDays([prevMonthStart, monthStart]);
  let dsoChangePercent: number | null = null;
  if (
    thisMonthCycle != null &&
    lastMonthCycle != null &&
    lastMonthCycle > 0
  ) {
    dsoChangePercent =
      ((thisMonthCycle - lastMonthCycle) / lastMonthCycle) * 100;
  }

  const sumsByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const k = d.toISOString().slice(0, 10);
    sumsByDay.set(k, 0);
  }
  for (const r of resolutions) {
    if (r.outcome_status !== "resolved" || !r.resolved_at) continue;
    const k = utcDayKey(r.resolved_at);
    if (!sumsByDay.has(k)) continue;
    const n = Number(r.amount_recovered ?? 0);
    if (Number.isNaN(n)) continue;
    sumsByDay.set(k, (sumsByDay.get(k) ?? 0) + n);
  }

  const cashVelocity: CashVelocityPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const k = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    cashVelocity.push({ day: label, amount: sumsByDay.get(k) ?? 0 });
  }

  return {
    totalRecoveredMtd,
    avgResolutionDays,
    openInvoices,
    dsoChangePercent,
    cashVelocity,
  };
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatShortDate(iso);
}

function mapInvoiceStatus(db: string | null): InvoiceRow["status"] {
  switch (db) {
    case "issues_detected":
      return "Issues detected";
    case "ingested":
      return "In review";
    case "resolving":
      return "In collections";
    case "resolved":
      return "Resolved";
    case "failed":
      return "Failed";
    default:
      return "In review";
  }
}

function lastActionForInvoice(status: string | null): string {
  switch (status) {
    case "issues_detected":
      return "Issues scan complete";
    case "ingested":
      return "Received";
    case "resolving":
      return "In resolution";
    case "resolved":
      return "Cash recovered";
    case "failed":
      return "Ingest failed";
    default:
      return "Updated";
  }
}

function mapOutcome(
  outcome: string | null
): Pick<ResolutionTimelineItem, "outcome" | "outcomeVariant"> {
  switch (outcome) {
    case "resolved":
      return { outcome: "Resolved", outcomeVariant: "success" };
    case "partial":
      return { outcome: "Partial", outcomeVariant: "warning" };
    case "failed":
      return { outcome: "Failed", outcomeVariant: "muted" };
    default:
      return { outcome: "Pending review", outcomeVariant: "muted" };
  }
}

function issuesToStrings(issues_detected: unknown): string[] {
  if (!Array.isArray(issues_detected)) return [];
  return issues_detected
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const summary = typeof o.summary === "string" ? o.summary : "";
      const detail = typeof o.detail === "string" ? o.detail : "";
      if (summary && detail) return `${summary}: ${detail}`;
      return summary || detail || null;
    })
    .filter((x): x is string => Boolean(x));
}

const emptyMetrics = (): ReturnType<typeof buildMetrics> =>
  buildMetrics([], []);

const RECENT_INVOICES_LIMIT = 25;
const RECENT_RESOLUTIONS_LIMIT = 25;

export async function getDashboardData(clerkUserId: string | null): Promise<{
  invoices: InvoiceRow[];
  resolutions: ResolutionTimelineItem[];
  fetchError: string | null;
  hasProfile: boolean;
  subscriptionPlanLabel: string;
  metrics: {
    totalRecoveredMtd: number;
    avgResolutionDays: number | null;
    openInvoices: number;
    dsoChangePercent: number | null;
    cashVelocity: CashVelocityPoint[];
  };
}> {
  if (!clerkUserId) {
    return {
      invoices: [],
      resolutions: [],
      fetchError: null,
      hasProfile: false,
      subscriptionPlanLabel: "Free",
      metrics: emptyMetrics(),
    };
  }

  if (!isSupabaseEnvConfigured()) {
    return {
      invoices: [],
      resolutions: [],
      fetchError:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      hasProfile: false,
      subscriptionPlanLabel: "Free",
      metrics: emptyMetrics(),
    };
  }

  try {
    const profileRow = await getProfileRowForClerkUser(clerkUserId);
    if (!profileRow) {
      return {
        invoices: [],
        resolutions: [],
        fetchError: null,
        hasProfile: false,
        subscriptionPlanLabel: "Free",
        metrics: emptyMetrics(),
      };
    }

    const profileId = profileRow.id;
    const subscriptionPlanLabel = formatSubscriptionPlanLabel(
      profileRow.subscription_plan
    );

    const supabase = createSupabaseAdminClient();

    const { data: allInvData, error: invErr } = await supabase
      .from("invoices")
      .select(
        "id, client_name, amount, currency, due_date, status, ingested_at, invoice_date"
      )
      .eq("user_id", profileId)
      .order("ingested_at", { ascending: false });

    if (invErr) {
      return {
        invoices: [],
        resolutions: [],
        fetchError: invErr.message,
        hasProfile: true,
        subscriptionPlanLabel,
        metrics: emptyMetrics(),
      };
    }

    const allInvoices = (allInvData ?? []) as DbInvoiceRow[];
    const invoiceIds = allInvoices.map((i) => i.id);

    let metrics = emptyMetrics();
    let allResolutions: DbResolutionRow[] = [];

    if (invoiceIds.length > 0) {
      const { data: resData, error: resErr } = await supabase
        .from("resolutions")
        .select(
          "id, invoice_id, created_at, outcome_status, issues_detected, amount_recovered, resolved_at, human_reviewed"
        )
        .in("invoice_id", invoiceIds);

      if (resErr) {
        return {
          invoices: [],
          resolutions: [],
          fetchError: resErr.message,
          hasProfile: true,
          subscriptionPlanLabel,
          metrics: emptyMetrics(),
        };
      }

      allResolutions = (resData ?? []) as DbResolutionRow[];

      const metricInvoices: DbInvoiceMetrics[] = allInvoices.map((i) => ({
        id: i.id,
        invoice_date: i.invoice_date,
        status: i.status,
      }));

      const metricRes: DbResolutionMetrics[] = allResolutions.map((r) => ({
        invoice_id: r.invoice_id,
        amount_recovered: r.amount_recovered,
        resolved_at: r.resolved_at,
        created_at: r.created_at,
        outcome_status: r.outcome_status,
      }));

      metrics = buildMetrics(metricInvoices, metricRes);
    }

    const byInvoice = new Map(allInvoices.map((i) => [i.id, i]));

    const recentInvoices = allInvoices.slice(0, RECENT_INVOICES_LIMIT);

    const sortedForTimeline = [...allResolutions].sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return tb - ta;
    });
    const timelineSlice = sortedForTimeline.slice(0, RECENT_RESOLUTIONS_LIMIT);

    const resolutions: ResolutionTimelineItem[] = timelineSlice.map((r) => {
      const inv = byInvoice.get(r.invoice_id);
      const client = inv?.client_name ?? "Invoice";
      const shortId = r.invoice_id.slice(0, 8);
      const o = mapOutcome(r.outcome_status);
      const currency = inv?.currency ?? "USD";
      const recovered =
        r.outcome_status === "resolved" && r.amount_recovered != null
          ? formatAmount(Number(r.amount_recovered), currency)
          : undefined;
      const issueLines = issuesToStrings(r.issues_detected);
      return {
        id: r.id,
        invoiceLabel: `${client} · ${shortId}`,
        ...o,
        recoveredLabel: recovered,
        humanReviewed: Boolean(r.human_reviewed),
        issues: issueLines.length > 0 ? issueLines : ["No issues recorded"],
        timestamp: formatRelative(r.created_at),
      };
    });

    const rows: InvoiceRow[] = recentInvoices.map((i) => ({
      id: i.id,
      client: i.client_name ?? "Unknown",
      amount: Number(i.amount ?? 0),
      currency: i.currency ?? "USD",
      dueDate: formatShortDate(i.due_date),
      status: mapInvoiceStatus(i.status),
      lastAction: lastActionForInvoice(i.status),
    }));

    return {
      invoices: rows,
      resolutions,
      fetchError: null,
      hasProfile: true,
      subscriptionPlanLabel,
      metrics,
    };
  } catch (e) {
    console.error("[getDashboardData]", e);
    return {
      invoices: [],
      resolutions: [],
      fetchError: null,
      hasProfile: false,
      subscriptionPlanLabel: "Free",
      metrics: emptyMetrics(),
    };
  }
}
