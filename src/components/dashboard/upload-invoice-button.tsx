"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getIngestUserMessage,
  isIngestSuccessResponse,
} from "@/lib/ingest/ingest-client";
import type { IngestErrorResponse, IngestSuccessResponse } from "@/lib/ingest/types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  disabled?: boolean;
};

async function parseJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Invoice import via drag-and-drop or file picker → POST `/api/ingest` (Supabase).
 * Accepts JSON exports (Ryvelo ingest schema); errors surface as Sonner toasts.
 */
export function UploadInvoiceButton({ className, disabled }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadPayload = useCallback(
    async (parsed: unknown) => {
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
          toast.error("Upload failed", {
            description: "The server returned an invalid response. Try again.",
          });
          return;
        }

        const asErr = data as Partial<IngestErrorResponse>;
        if (
          !res.ok ||
          (typeof asErr?.ok === "boolean" && asErr.ok === false)
        ) {
          toast.error("Couldn’t import invoice", {
            description: getIngestUserMessage(data, res.status),
          });
          return;
        }

        if (!isIngestSuccessResponse(data)) {
          toast.error("Couldn’t import invoice", {
            description: "Unexpected response from the server.",
          });
          return;
        }

        const ok = data as IngestSuccessResponse;
        toast.success("Invoice imported", {
          description: `${ok.analysis.issues.length} issue(s) detected · overall risk ${ok.analysis.overall_risk}`,
        });
        router.prefetch("/dashboard");
        router.prefetch("/resolutions");
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        toast.error("Upload failed", { description: msg });
      } finally {
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [router]
  );

  const onFile = useCallback(
    async (file: File) => {
      let parsed: unknown;
      try {
        parsed = await parseJsonFile(file);
      } catch {
        toast.error("Couldn’t read this file", {
          description: "Use a text-based invoice export with valid JSON.",
        });
        return;
      }
      await uploadPayload(parsed);
    },
    [uploadPayload]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void onFile(f);
    },
    [onFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) setDragActive(true);
  }, [disabled, loading]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled || loading) return;
      const f = e.dataTransfer.files?.[0];
      if (f) void onFile(f);
    },
    [disabled, loading, onFile]
  );

  const blocked = disabled || loading;

  return (
    <div className={cn("w-full max-w-md", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json,text/plain"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onInputChange}
      />
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!blocked) inputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!blocked) inputRef.current?.click();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-border/80 bg-card/40 px-4 py-3 transition-colors",
          "hover:border-accent/50 hover:bg-card/60",
          dragActive && "border-accent bg-accent/5 ring-2 ring-accent/20",
          blocked && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground",
              "group-hover:text-foreground"
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            ) : (
              <FileUp className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-medium text-foreground">
              {loading ? "Importing…" : "Upload invoice"}
            </p>
            <p className="text-xs text-muted-foreground">
              {blocked && !loading
                ? "Your workspace is still loading."
                : "Drag and drop here, or browse · one file at a time"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={blocked}
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Browse
          </Button>
        </div>
      </div>
    </div>
  );
}
