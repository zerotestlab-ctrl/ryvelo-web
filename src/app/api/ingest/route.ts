import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { runIngestInvoice } from "@/lib/ingest/run-ingest";
import type { IngestErrorResponse } from "@/lib/ingest/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function statusFromError(result: IngestErrorResponse): number {
  switch (result.code) {
    case "UNAUTHORIZED":
      return 401;
    case "NO_PROFILE":
    case "VALIDATION":
      return 400;
    case "CONFIG":
      return 503;
    case "LLM":
      return 502;
    default:
      return 500;
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 512_000) {
      return NextResponse.json(
        { ok: false, error: "Payload too large", code: "VALIDATION" } satisfies IngestErrorResponse,
        { status: 400 }
      );
    }
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body", code: "VALIDATION" } satisfies IngestErrorResponse,
      { status: 400 }
    );
  }

  const result = await runIngestInvoice({ clerkUserId: userId, body });

  if (!result.ok) {
    return NextResponse.json(result, { status: statusFromError(result) });
  }

  return NextResponse.json(result);
}
