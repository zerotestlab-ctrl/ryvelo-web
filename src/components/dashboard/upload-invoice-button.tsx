"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ClipboardPaste, FileUp, Loader2 } from "lucide-react";
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

type UploadTab = "file" | "paste";

async function parseJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  return text ? JSON.parse(text) : {};
}

/**
 * - Full ingest shape `{ source, raw_data }` → unchanged.
 * - Plain invoice object → `{ source: "manual", raw_data: { ... } }`.
 */
function normalizePastedIngestPayload(parsed: unknown): unknown | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const o = parsed as Record<string, unknown>;
  const hasFullShape =
    typeof o.source === "string" &&
    o.source.trim().length > 0 &&
    o.raw_data !== null &&
    o.raw_data !== undefined &&
    typeof o.raw_data === "object" &&
    !Array.isArray(o.raw_data);
  if (hasFullShape) {
    return parsed;
  }

  const optionalTop: Record<string, unknown> = {};
  if (typeof o.client_name === "string") {
    optionalTop.client_name = o.client_name.slice(0, 500);
  }
  if (typeof o.client_email === "string") {
    optionalTop.client_email = o.client_email.slice(0, 320);
  }
  if (typeof o.amount === "number" && Number.isFinite(o.amount)) {
    optionalTop.amount = o.amount;
  }
  if (typeof o.currency === "string") {
    optionalTop.currency = o.currency.slice(0, 12).toUpperCase();
  }
  if (typeof o.invoice_date === "string" || o.invoice_date === null) {
    optionalTop.invoice_date = o.invoice_date;
  }
  if (typeof o.due_date === "string" || o.due_date === null) {
    optionalTop.due_date = o.due_date;
  }

  return {
    source: "manual",
    raw_data: { ...o },
    ...optionalTop,
  };
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
  const [tab, setTab] = useState<UploadTab>("file");
  const [pasteText, setPasteText] = useState("");

  const uploadPayload = useCallback(
    async (parsed: unknown, options?: { clearPaste?: boolean }) => {
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
        toast.success("Invoice ingested successfully — check Resolutions", {
          description: `${ok.analysis.issues.length} issue(s) · risk ${ok.analysis.overall_risk}`,
        });
        if (options?.clearPaste) {
          setPasteText("");
        }
        router.prefetch("/dashboard");
        router.prefetch("/resolutions");
        router.prefetch("/invoices");
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

  const onImportJson = useCallback(() => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      toast.error("Paste JSON first", {
        description: "Add invoice JSON in the text area, then import.",
      });
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      toast.error("Invalid JSON", {
        description: "Fix syntax errors and try again.",
      });
      return;
    }
    const payload = normalizePastedIngestPayload(parsed);
    if (payload === null) {
      toast.error("Unsupported JSON", {
        description: "Use a JSON object (not an array) or full { source, raw_data }.",
      });
      return;
    }
    void uploadPayload(payload, { clearPaste: true });
  }, [pasteText, uploadPayload]);

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
    <div className={cn("w-full max-w-md space-y-3", className)}>
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
        className="flex rounded-lg border border-border/70 bg-slate-950/40 p-0.5 shadow-inner shadow-black/20"
        role="tablist"
        aria-label="Invoice import method"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "file"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
            tab === "file"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          )}
          onClick={() => setTab("file")}
        >
          <FileUp className="h-3.5 w-3.5 opacity-90" />
          Upload File
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "paste"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
            tab === "paste"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          )}
          onClick={() => setTab("paste")}
        >
          <ClipboardPaste className="h-3.5 w-3.5 opacity-90" />
          Paste JSON
        </button>
      </div>

      {tab === "file" ? (
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
                {loading ? "Importing…" : "Upload Invoice"}
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
      ) : (
        <div
          className="rounded-xl border border-border/80 bg-card/40 p-4 shadow-sm shadow-black/10"
          role="tabpanel"
        >
          <label htmlFor="invoice-json-paste" className="sr-only">
            Invoice JSON
          </label>
          <textarea
            id="invoice-json-paste"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your invoice JSON here..."
            disabled={blocked}
            spellCheck={false}
            className={cn(
              "min-h-[220px] w-full resize-y rounded-lg border border-border/70 bg-background/80 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground",
              "placeholder:text-muted-foreground/70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              blocked && "cursor-not-allowed opacity-60"
            )}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              Plain invoice object or full <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[10px]">{`{ source, raw_data }`}</code>
            </p>
            <Button
              type="button"
              size="sm"
              className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={blocked || !pasteText.trim()}
              onClick={onImportJson}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                "Import JSON"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
