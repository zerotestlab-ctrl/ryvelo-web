"use server";

import { auth } from "@clerk/nextjs/server";

import { runIngestInvoice } from "@/lib/ingest/run-ingest";

/**
 * Same pipeline as POST /api/ingest — use from Server Components or server actions.
 */
export async function ingestInvoiceAction(body: unknown) {
  const { userId } = await auth();
  return runIngestInvoice({ clerkUserId: userId, body });
}
