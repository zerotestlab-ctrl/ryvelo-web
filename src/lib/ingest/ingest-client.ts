import type { IngestErrorResponse, IngestSuccessResponse } from "@/lib/ingest/types";

/** Client-side guard for POST /api/ingest JSON body. */
export function isIngestSuccessResponse(data: unknown): data is IngestSuccessResponse {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    o.ok === true &&
    typeof o.invoice_id === "string" &&
    typeof o.resolution_id === "string" &&
    o.analysis !== null &&
    typeof o.analysis === "object"
  );
}

export function getIngestErrorMessage(
  data: unknown,
  httpStatus: number
): string {
  const o = data as Partial<IngestErrorResponse>;
  if (typeof o.error === "string") return o.error;
  return `Request failed (${httpStatus})`;
}
