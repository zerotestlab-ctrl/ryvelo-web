/**
 * Paystack hosted checkout URLs (Dashboard products).
 * Override per deployment via `PAYSTACK_RESOLUTION_CHECKOUT_URL` (server) for resolution “collect” links.
 */
export const PAYSTACK_CHECKOUT_STARTER_URL =
  "https://paystack.shop/pay/azsd6l063h";
export const PAYSTACK_CHECKOUT_PRO_URL =
  "https://paystack.shop/pay/gto1y470q5";

/** Smallest currency unit for Paystack (cents / kobo). */
function amountToMinorUnits(amountMajor: number, currency: string): number {
  const cur = currency.toUpperCase();
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) return 0;
  // NGN kobo and USD/EUR cents: major × 100
  if (cur === "JPY" || cur === "KRW") {
    return Math.round(amountMajor);
  }
  return Math.round(amountMajor * 100);
}

function applyTrackingAndAmount(
  u: URL,
  params: {
    invoiceId: string;
    resolutionId?: string;
    amount?: number;
    currency?: string;
  }
): void {
  u.searchParams.set("utm_source", "ryvelo_resolution");
  u.searchParams.set("invoice_id", params.invoiceId);
  if (params.resolutionId) {
    u.searchParams.set("resolution_id", params.resolutionId);
  }
  const cur = (params.currency ?? "USD").toUpperCase();
  const minor = amountToMinorUnits(params.amount ?? 0, cur);
  if (minor > 0) {
    u.searchParams.set("amount", String(minor));
    u.searchParams.set("currency", cur);
  }
}

/**
 * Primary link after approve — Pro checkout + invoice amount (minor units) when provided.
 * Hosted pages may fix amount in Dashboard; query params document intent for ops.
 */
export function buildPaystackCollectUrl(params: {
  invoiceId: string;
  resolutionId?: string;
  /** Invoice total in major units (e.g. 1250.5) — passed as amount+currency when set. */
  amount?: number;
  currency?: string;
}): string {
  const base =
    process.env.PAYSTACK_RESOLUTION_CHECKOUT_URL?.trim() ||
    PAYSTACK_CHECKOUT_PRO_URL;
  try {
    const u = new URL(base);
    applyTrackingAndAmount(u, params);
    return u.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    let q = `utm_source=ryvelo_resolution&invoice_id=${encodeURIComponent(params.invoiceId)}`;
    if (params.resolutionId) {
      q += `&resolution_id=${encodeURIComponent(params.resolutionId)}`;
    }
    const cur = (params.currency ?? "USD").toUpperCase();
    const minor = amountToMinorUnits(params.amount ?? 0, cur);
    if (minor > 0) {
      q += `&amount=${minor}&currency=${encodeURIComponent(cur)}`;
    }
    return `${base}${sep}${q}`;
  }
}

/**
 * Client: merge amount/currency into an existing Paystack URL if missing (older rows).
 */
export function ensurePaystackUrlWithAmount(
  url: string,
  amountMajor: number,
  currency: string
): string {
  if (!url.trim()) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("amount") && amountMajor > 0) {
      const cur = currency.toUpperCase();
      const minor = amountToMinorUnits(amountMajor, cur);
      if (minor > 0) {
        u.searchParams.set("amount", String(minor));
        u.searchParams.set("currency", cur);
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}
