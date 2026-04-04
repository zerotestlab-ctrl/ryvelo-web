"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { runIngestInvoice } from "@/lib/ingest/run-ingest";
import type { IngestErrorResponse, IngestSuccessResponse } from "@/lib/ingest/types";

const LOG = "[ingestInvoiceAction]";

function revalidateIngestPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/resolutions");
  revalidatePath("/invoices");
}

/**
 * Same pipeline as POST /api/ingest — use from Server Components or server actions.
 */
export async function ingestInvoiceAction(
  body: unknown
): Promise<IngestSuccessResponse | IngestErrorResponse> {
  console.log(`${LOG} invoked`);

  try {
    const { userId } = await auth();
    const result = await runIngestInvoice({ clerkUserId: userId, body });

    if (result.ok) {
      console.log(`${LOG} success`, {
        invoice_id: result.invoice_id,
        resolution_id: result.resolution_id,
      });
      revalidateIngestPaths();
    } else {
      console.warn(`${LOG} failed`, result.code, result.error);
    }

    return result;
  } catch (e) {
    console.error(`${LOG} unexpected error`, e);
    const message =
      e instanceof Error ? e.message : "Unexpected error while ingesting.";
    return { ok: false, error: message, code: "DATABASE" };
  }
}
