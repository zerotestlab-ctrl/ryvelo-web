"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getIngestErrorMessage,
  isIngestSuccessResponse,
} from "@/lib/ingest/ingest-client";
import type { IngestErrorResponse, IngestSuccessResponse } from "@/lib/ingest/types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  disabled?: boolean;
};

/**
 * Upload a JSON invoice file → POST `/api/ingest` (live Supabase). No payload editor in UI.
 */
export function UploadInvoiceButton({ className, disabled }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const onFile = useCallback(
    async (file: File) => {
      let parsed: unknown;
      try {
        const text = await file.text();
        parsed = text ? JSON.parse(text) : {};
      } catch {
        toast.error("Invalid JSON", {
          description: "Choose a valid JSON invoice file.",
        });
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
        const rawText = await res.text();
        let data: unknown;
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          const msg = `Invalid response (${res.status})`;
          toast.error("Ingest failed", { description: msg });
          return;
        }

        const asErr = data as Partial<IngestErrorResponse>;
        if (
          !res.ok ||
          (typeof asErr?.ok === "boolean" && asErr.ok === false)
        ) {
          const errMsg =
            typeof asErr?.error === "string"
              ? asErr.error
              : getIngestErrorMessage(data, res.status);
          toast.error("Ingest failed", { description: errMsg });
          return;
        }

        if (!isIngestSuccessResponse(data)) {
          toast.error("Ingest failed", {
            description: "Unexpected response from server.",
          });
          return;
        }

        const ok = data as IngestSuccessResponse;
        toast.success("Invoice ingested", {
          description: `${ok.analysis.issues.length} issue(s) · risk ${ok.analysis.overall_risk}`,
        });
        router.prefetch("/dashboard");
        router.prefetch("/resolutions");
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        toast.error("Ingest failed", { description: msg });
      } finally {
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [router]
  );

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || loading}
        className="gap-2"
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        {loading ? "Uploading…" : "Upload invoice"}
      </Button>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        JSON file · ingest to Supabase
      </span>
    </div>
  );
}
