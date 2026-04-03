import { createSupabaseAdminClient, getProfileIdForClerkUser } from "@/lib/supabase/admin";
import type { InvoiceRow } from "@/lib/dashboard-placeholder";
import type { ResolutionTimelineItem } from "@/components/ui/resolution-timeline";
import type { CashVelocityPoint } from "@/components/dashboard/cash-velocity-chart";
import { formatAmount } from "@/lib/format";

type DbInvoice = {
  id: string;
  client_name: string | null;
  amount: string | number | null;
  currency: string | null;
  due_date: string | null;
  status: string | null;
  ingested_at: string | null;
};

type DbResolution = {
  id: string;
  invoice_id: string;
  created_at: string | null;
  outcome_status: string | null;
  issues_detected: unknown;
  amount_recovered: string | number | null;
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

  /** Average calendar days from invoice_date → resolved_at for resolved rows in a window. */
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

export async function getDashboardData(clerkUserId: string | null): Promise<{
  invoices: InvoiceRow[];
  resolutions: ResolutionTimelineItem[];
  fetchError: string | null;
  hasProfile: boolean;
  metrics: {
    totalRecoveredMtd: number;
    avgResolutionDays: number | null;
    openInvoices: number;
    dsoChangePercent: number | null;
    cashVelocity: CashVelocityPoint[];
  };
}> {
  const emptyMetrics = {
    totalRecoveredMtd: 0,
    avgResolutionDays: null as number | null,
    openInvoices: 0,
    dsoChangePercent: null as number | null,
    cashVelocity: [] as CashVelocityPoint[],
  };

  if (!clerkUserId) {
    return {
      invoices: [],
      resolutions: [],
      fetchError: null,
      hasProfile: false,
      metrics: emptyMetrics,
    };
  }

  try {
    const profileId = await getProfileIdForClerkUser(clerkUserId);
    if (!profileId) {
      return {
        invoices: [],
        resolutions: [],
        fetchError: null,
        hasProfile: false,
        metrics: emptyMetrics,
      };
    }

    const supabase = createSupabaseAdminClient();

    const { data: metricInvoices, error: metricInvErr } = await supabase
      .from("invoices")
      .select("id, invoice_date, status")
      .eq("user_id", profileId);

    if (metricInvErr) {
      return {
        invoices: [],
        resolutions: [],
        fetchError: metricInvErr.message,
        hasProfile: true,
        metrics: emptyMetrics,
      };
    }

    const metricIds = (metricInvoices ?? []).map((m) => m.id);
    let metrics = emptyMetrics;
    if (metricIds.length > 0) {
      const { data: metricRes, error: metricResErr } = await supabase
        .from("resolutions")
        .select(
          "invoice_id, amount_recovered, resolved_at, created_at, outcome_status"
        )
        .in("invoice_id", metricIds);

      if (!metricResErr && metricRes) {
        metrics = buildMetrics(
          (metricInvoices ?? []) as DbInvoiceMetrics[],
          metricRes as DbResolutionMetrics[]
        );
      }
    }

    const { data: invData, error: invErr } = await supabase
      .from("invoices")
      .select(
        "id, client_name, amount, currency, due_date, status, ingested_at"
      )
      .eq("user_id", profileId)
      .order("ingested_at", { ascending: false })
      .limit(25);

    if (invErr) {
      return {
        invoices: [],
        resolutions: [],
        fetchError: invErr.message,
        hasProfile: true,
        metrics,
      };
    }

    const invoices = (invData ?? []) as DbInvoice[];
    const ids = invoices.map((i) => i.id);

    let resolutions: ResolutionTimelineItem[] = [];
    if (ids.length > 0) {
      const { data: resData, error: resErr } = await supabase
        .from("resolutions")
        .select(
          "id, invoice_id, created_at, outcome_status, issues_detected, amount_recovered"
        )
        .in("invoice_id", ids)
        .order("created_at", { ascending: false })
        .limit(25);

      if (resErr) {
        return {
          invoices: [],
          resolutions: [],
          fetchError: resErr.message,
          hasProfile: true,
          metrics,
        };
      }

      const byInvoice = new Map(invoices.map((i) => [i.id, i]));

      resolutions = ((resData ?? []) as DbResolution[]).map((r) => {
        const inv = byInvoice.get(r.invoice_id);
        const client = inv?.client_name ?? "Invoice";
        const shortId = r.invoice_id.slice(0, 8);
        const o = mapOutcome(r.outcome_status);
        const currency = inv?.currency ?? "USD";
        const recovered =
          r.outcome_status === "resolved" && r.amount_recovered != null
            ? formatAmount(Number(r.amount_recovered), currency)
            : undefined;
        return {
          id: r.id,
          invoiceLabel: `${client} · ${shortId}`,
          ...o,
          recoveredLabel: recovered,
          issues:
            issuesToStrings(r.issues_detected).length > 0
              ? issuesToStrings(r.issues_detected)
              : ["No issues recorded"],
          timestamp: formatRelative(r.created_at),
        };
      });
    }

    const rows: InvoiceRow[] = invoices.map((i) => ({
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
      metrics,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Dashboard load failed";
    return {
      invoices: [],
      resolutions: [],
      fetchError: msg,
      hasProfile: false,
      metrics: emptyMetrics,
    };
  }
}
