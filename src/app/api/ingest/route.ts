import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { revalidateAppRoutes } from "@/lib/cache/revalidate-app-routes";
import { runIngestInvoice } from "@/lib/ingest/run-ingest";
import type { IngestErrorResponse } from "@/lib/ingest/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LOG = "[api/ingest]";

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
  console.log(`${LOG} POST received`);

  try {
    const { userId } = await auth();
    if (!userId) {
      console.warn(`${LOG} unauthenticated`);
    }

    let body: unknown;
    try {
      const text = await req.text();
      if (text.length > 512_000) {
        console.warn(`${LOG} payload too large`, text.length);
        return NextResponse.json(
          {
            ok: false,
            error: "Payload too large (max 512KB).",
            code: "VALIDATION",
          } satisfies IngestErrorResponse,
          { status: 400 }
        );
      }
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error(`${LOG} JSON parse error`, e);
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body. Send valid JSON with source and raw_data.",
          code: "VALIDATION",
        } satisfies IngestErrorResponse,
        { status: 400 }
      );
    }

    const result = await runIngestInvoice({ clerkUserId: userId, body });

    if (!result.ok) {
      console.warn(`${LOG} ingest failed`, result.code, result.error);
      const friendly =
        result.code === "NO_PROFILE"
          ? {
              ...result,
              error:
                result.error ||
                "Account setup is not complete. Try again in a moment or refresh the page.",
            }
          : result;
      return NextResponse.json(friendly, { status: statusFromError(result) });
    }

    console.log(`${LOG} ingest success`, {
      invoice_id: result.invoice_id,
      resolution_id: result.resolution_id,
    });
    revalidateAppRoutes();

    return NextResponse.json(result);
  } catch (e) {
    console.error(`${LOG} unexpected error`, e);
    const message =
      e instanceof Error ? e.message : "Unexpected server error during ingest.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        code: "DATABASE",
      } satisfies IngestErrorResponse,
      { status: 500 }
    );
  }
}
