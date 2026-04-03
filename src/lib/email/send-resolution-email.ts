import { Resend } from "resend";

export type SendResolutionEmailInput = {
  to: string;
  subject: string;
  /** Plain + simple HTML body including payment link line */
  textBody: string;
  /** Primary CTA (e.g. Stripe checkout) */
  paymentLink?: string;
  /** Additional labeled links (Stripe fee, Wise collection, etc.) */
  paymentLinks?: { label: string; url: string }[];
};

/**
 * Sends chase / resolution email via Resend.
 * ZEROTEST: if RESEND_API_KEY is unset, returns { skipped: true } — no throw.
 */
export async function sendResolutionEmail(
  input: SendResolutionEmailInput
): Promise<
  | { ok: true; id: string }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string }
> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESOLUTION_EMAIL_FROM;

  if (!key || !from) {
    return {
      ok: true,
      skipped: true,
      reason: "RESEND_API_KEY or RESOLUTION_EMAIL_FROM not set (ZEROTEST / local)",
    };
  }

  try {
    const resend = new Resend(key);
    const extraLinks = input.paymentLinks ?? [];
    const linkBlocks: { label: string; url: string }[] = [];
    const seen = new Set<string>();
    const push = (label: string, url: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      linkBlocks.push({ label, url });
    };
    if (input.paymentLink) push("Payment", input.paymentLink);
    for (const l of extraLinks) push(l.label, l.url);
    const linksHtml = linkBlocks
      .map(
        (l) =>
          `<p style="margin:0.35em 0;"><a href="${escapeAttr(l.url)}">${escapeHtml(l.label)}</a></p>`
      )
      .join("");

    const html = `
      <div style="font-family: system-ui, sans-serif; line-height: 1.5;">
        <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(input.textBody)}</pre>
        ${linksHtml ? `<div style="margin-top:1rem;">${linksHtml}</div>` : ""}
      </div>
    `.trim();

    const textSuffix =
      linkBlocks.length > 0
        ? "\n\n" + linkBlocks.map((l) => `${l.label}: ${l.url}`).join("\n")
        : "";

    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.textBody + textSuffix,
      html,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.id) {
      return { ok: false, error: "Resend returned no id" };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
