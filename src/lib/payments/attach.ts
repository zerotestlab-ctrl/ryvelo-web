/**
 * Payment + collection links for resolution outcomes.
 *
 * ZEROTEST: without STRIPE_SECRET_KEY / Wise env, returns sandbox-style URLs so flows still run.
 */

import Stripe from "stripe";

export type AttachPaymentLinksResult = {
  /** Success fee (5–12% of recovered) — Stripe Checkout when configured */
  stripeFeeCheckoutUrl?: string;
  /** Wise collection / payout handoff (sandbox or live) */
  wisePayUrl?: string;
  /** Best link to surface first in email */
  primaryUrl: string;
  feePercent: number;
  feeAmount: number;
  currency: string;
};

function feePercentFromEnv(): number {
  const raw = Number(process.env.RYVELO_SUCCESS_FEE_PERCENT ?? 8.5);
  if (Number.isNaN(raw)) return 8.5;
  return Math.min(12, Math.max(5, raw));
}

function moneyToStripeUnit(amount: number, currency: string): number {
  const c = currency.toUpperCase();
  const zeroDecimal = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);
  if (zeroDecimal.has(c)) return Math.round(amount);
  return Math.round(amount * 100);
}

/**
 * Stripe Payment Link equivalent: Checkout Session for one-time success fee on recovered cash.
 */
async function createStripeFeeCheckout(params: {
  recoveredAmount: number;
  currency: string;
  invoiceId: string;
  resolutionId: string;
  feePercent: number;
  feeAmount: number;
}): Promise<string | undefined> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return undefined;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const stripe = new Stripe(secret, {
      typescript: true,
    });

    const unitAmount = moneyToStripeUnit(params.feeAmount, params.currency);
    if (unitAmount <= 0) return undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/dashboard?payment=cancelled`,
      metadata: {
        invoice_id: params.invoiceId,
        resolution_id: params.resolutionId,
        fee_type: "success_fee",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: unitAmount,
            product_data: {
              name: `Ryvelo success fee (${params.feePercent}% of recovered)`,
              metadata: {
                invoice_id: params.invoiceId,
              },
            },
          },
        },
      ],
    });

    return session.url ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Wise: sandbox hosted pay path when test keys exist; otherwise a stable test URL.
 * Docs: https://api-docs.wise.com/ — full quote flow is heavier; this stays attachable for QA.
 */
function createWiseHandoffUrl(params: {
  invoiceId: string;
  resolutionId: string;
  amount: number;
  currency: string;
}): string {
  const apiKey = process.env.WISE_API_KEY;
  const profile = process.env.WISE_PROFILE_ID ?? process.env.WISE_SANDBOX_PROFILE_ID;
  const base =
    process.env.WISE_USE_SANDBOX === "true" ||
    process.env.WISE_API_BASE?.includes("sandbox")
      ? "https://sandbox.transferwise.tech"
      : "https://wise.com";

  const q = new URLSearchParams({
    ref: params.resolutionId,
    invoice: params.invoiceId,
    amount: String(params.amount),
    currency: params.currency.toUpperCase(),
  });

  if (apiKey && profile) {
    q.set("profile", profile);
    return `${base}/pay?${q.toString()}`;
  }

  /** ZEROTEST: no secrets — still return a deterministic test URL */
  return `${base}/send#test-${params.invoiceId.slice(0, 8)}?${q.toString()}`;
}

export async function createAttachablePaymentLinks(input: {
  recoveredAmount: number;
  currency: string;
  invoiceId: string;
  resolutionId: string;
}): Promise<AttachPaymentLinksResult> {
  const feePercent = feePercentFromEnv();
  const feeAmount =
    Math.round(input.recoveredAmount * (feePercent / 100) * 100) / 100;

  const stripeFeeCheckoutUrl = await createStripeFeeCheckout({
    recoveredAmount: input.recoveredAmount,
    currency: input.currency,
    invoiceId: input.invoiceId,
    resolutionId: input.resolutionId,
    feePercent,
    feeAmount,
  });

  const wisePayUrl = createWiseHandoffUrl({
    invoiceId: input.invoiceId,
    resolutionId: input.resolutionId,
    amount: input.recoveredAmount,
    currency: input.currency,
  });

  const primaryUrl = stripeFeeCheckoutUrl ?? wisePayUrl;

  return {
    stripeFeeCheckoutUrl,
    wisePayUrl,
    primaryUrl,
    feePercent,
    feeAmount,
    currency: input.currency.toUpperCase(),
  };
}
