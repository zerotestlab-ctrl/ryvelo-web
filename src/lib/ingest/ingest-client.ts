import type { IngestErrorResponse, IngestSuccessResponse } from "@/lib/ingest/types";

/** Maps API error payloads to short, user-visible descriptions (toasts). */
export function getIngestUserMessage(
  data: unknown,
  httpStatus: number
): string {
  const o = data as Partial<IngestErrorResponse>;
  const code = o.code;
  const err = typeof o.error === "string" ? o.error : "";

  if (code === "UNAUTHORIZED" || httpStatus === 401) {
    return "Sign in to upload invoices.";
  }
  if (code === "NO_PROFILE") {
    return err || "We couldn’t finish account setup. Try again in a moment.";
  }
  if (code === "VALIDATION") {
    return err || "Check your file: use JSON with source and raw_data fields.";
  }
  if (code === "CONFIG" || httpStatus === 503) {
    return "Service is temporarily unavailable. Try again later.";
  }
  if (code === "LLM" || httpStatus === 502) {
    return err || "Analysis service failed. Try again shortly.";
  }
  if (typeof o.error === "string" && o.error.trim()) {
    return o.error;
  }
  return httpStatus >= 500
    ? "Something went wrong on our side. Try again."
    : `Could not upload (${httpStatus}).`;
}

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
  return getIngestUserMessage(data, httpStatus);
}
