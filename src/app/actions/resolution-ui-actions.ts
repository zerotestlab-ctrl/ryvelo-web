"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { runResolutionWorkflow } from "@/lib/agents/resolution-graph";
import { createSupabaseAdminClient, getProfileIdForClerkUser } from "@/lib/supabase/admin";

async function assertInvoiceOwnedByUser(
  clerkUserId: string,
  invoiceId: string
): Promise<boolean> {
  const profileId = await getProfileIdForClerkUser(clerkUserId);
  if (!profileId) return false;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", invoiceId)
    .eq("user_id", profileId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/**
 * Run the full resolution graph (detect → propose → execute → log) without the human gate.
 * Use from dashboard “Resolve now” for owned invoices.
 */
export async function resolveInvoiceNowAction(invoiceId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false as const, error: "Not signed in" };
  }

  const ok = await assertInvoiceOwnedByUser(userId, invoiceId);
  if (!ok) {
    return { ok: false as const, error: "Invoice not found" };
  }

  let result: Awaited<ReturnType<typeof runResolutionWorkflow>>;
  try {
    result = await runResolutionWorkflow(invoiceId, {
      runUnattended: true,
    });
  } catch (e) {
    console.error("[resolveInvoiceNowAction]", e);
    return {
      ok: false as const,
      error: "Something went wrong. Please try again.",
    };
  }

  revalidatePath("/resolutions");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  if (result.phase === "failed") {
    return {
      ok: false as const,
      error: result.error ?? "Workflow failed",
    };
  }

  return {
    ok: true as const,
    phase: result.phase,
    warning: result.phase === "completed" ? result.warning : undefined,
  };
}

export async function approveResolutionAction(invoiceId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false as const, error: "Not signed in" };
  }

  const ok = await assertInvoiceOwnedByUser(userId, invoiceId);
  if (!ok) {
    return { ok: false as const, error: "Invoice not found" };
  }

  let result: Awaited<ReturnType<typeof runResolutionWorkflow>>;
  try {
    result = await runResolutionWorkflow(invoiceId, {
      humanApproved: true,
    });
  } catch (e) {
    console.error("[approveResolutionAction]", e);
    return {
      ok: false as const,
      error: "Something went wrong. Please try again.",
    };
  }

  revalidatePath("/resolutions");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  if (result.phase === "failed") {
    return {
      ok: false as const,
      error: result.error ?? "Workflow failed",
    };
  }

  return {
    ok: true as const,
    warning: result.phase === "completed" ? result.warning : undefined,
  };
}

export async function rejectResolutionAction(resolutionId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false as const, error: "Not signed in" };
  }

  try {
    const profileId = await getProfileIdForClerkUser(userId);
    if (!profileId) {
      return { ok: false as const, error: "No profile" };
    }

    const supabase = createSupabaseAdminClient();
    const { data: res, error: fetchErr } = await supabase
      .from("resolutions")
      .select("id, invoice_id")
      .eq("id", resolutionId)
      .maybeSingle();

    if (fetchErr || !res?.invoice_id) {
      return { ok: false as const, error: "Resolution not found" };
    }

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("user_id")
      .eq("id", res.invoice_id)
      .single();

    if (invErr || !inv || inv.user_id !== profileId) {
      return { ok: false as const, error: "Forbidden" };
    }

    const { error: upErr } = await supabase
      .from("resolutions")
      .update({
        outcome_status: "failed",
        human_reviewed: true,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", resolutionId);

    if (upErr) {
      return { ok: false as const, error: upErr.message };
    }

    revalidatePath("/resolutions");
    revalidatePath("/dashboard");
    revalidatePath("/invoices");

    return { ok: true as const };
  } catch (e) {
    console.error("[rejectResolutionAction]", e);
    return {
      ok: false as const,
      error: "Something went wrong. Please try again.",
    };
  }
}
