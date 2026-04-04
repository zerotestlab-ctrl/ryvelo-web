"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DEFAULT_TEST_INVOICE_PAYLOAD } from "@/lib/ingest/default-test-payload";
import type { IngestErrorResponse, IngestSuccessResponse } from "@/lib/ingest/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DEFAULT_JSON = JSON.stringify(DEFAULT_TEST_INVOICE_PAYLOAD, null, 2);

type Props = {
  className?: string;
};

export function UploadTestInvoice({ className }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(DEFAULT_JSON);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<IngestSuccessResponse | null>(
    null
  );
  const [dragActive, setDragActive] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    setLastResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("Invalid JSON. Fix the payload and try again.");
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
        const snippet = rawText.slice(0, 280).trim() || "(empty body)";
        const msg = `Invalid response (${res.status}). ${snippet}`;
        setError(msg);
        toast.error("Ingest failed", { description: msg });
        return;
      }

      const asErr = data as Partial<IngestErrorResponse>;
      const asOk = data as Partial<IngestSuccessResponse>;

      if (
        !res.ok ||
        asErr.ok === false ||
        (typeof asOk.ok === "boolean" && asOk.ok === false)
      ) {
        const errMsg =
          typeof asErr.error === "string"
            ? asErr.error
            : `Request failed (${res.status})`;
        const code =
          typeof asErr.code === "string" ? ` [${asErr.code}]` : "";
        const full = `${errMsg}${code}`;
        setError(full);
        toast.error("Ingest failed", { description: full });
        return;
      }

      if (asOk.ok !== true || typeof asOk.invoice_id !== "string") {
        const msg = "Unexpected response from server. Try again or check logs.";
        setError(msg);
        toast.error("Ingest failed", { description: msg });
        return;
      }

      setLastResult(asOk as IngestSuccessResponse);
      toast.success("Invoice ingested", {
        description: `${asOk.analysis?.issues?.length ?? 0} issue(s) · risk ${asOk.analysis?.overall_risk ?? "—"}`,
      });
      router.refresh();
      router.prefetch("/resolutions");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setError(msg);
      toast.error("Ingest failed", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [router, value]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      try {
        JSON.parse(text);
        setValue(text);
        setError(null);
      } catch {
        setError("Dropped file is not valid JSON.");
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <Card
      className={cn(
        "border-border/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] shadow-black/20",
        className
      )}
    >
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-base font-semibold tracking-tight text-foreground">
          Ingest test invoice
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Secure ingest runs issue detection (FX, tax, compliance), then
          creates matching invoice and resolution records. Next: review on{" "}
          <Link
            href="/resolutions"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Resolutions
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="presentation"
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (e.currentTarget === e.target) setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "rounded-xl border border-dashed border-border bg-black/[0.12] px-4 py-8 text-center transition-colors",
            dragActive && "border-accent/60 bg-accent/5"
          )}
        >
          <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag a JSON file here, or edit the payload below.
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-6 min-w-[240px]"
            onClick={() => void submit()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Processing…
              </>
            ) : (
              "Upload test invoice"
            )}
          </Button>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Payload (JSON)
          </label>
          <textarea
            className={cn(
              "mt-1.5 min-h-[200px] w-full resize-y rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-foreground shadow-inner outline-none",
              "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            )}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => {
              setValue(DEFAULT_JSON);
              setError(null);
            }}
          >
            Reset sample
          </Button>
        </div>

        {error ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {lastResult ? (
          <div className="rounded-lg border border-border/90 bg-card/50 px-4 py-3 text-xs text-muted-foreground shadow-sm">
            <div className="font-medium text-foreground">
              Ingest complete · {lastResult.analysis.issues.length} issue
              {lastResult.analysis.issues.length === 1 ? "" : "s"} · risk{" "}
              <span className="text-accent">{lastResult.analysis.overall_risk}</span>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {lastResult.analysis.issues.map((i, idx) => (
                <li key={`${i.category}-${idx}`}>
                  <span className="text-foreground">{i.summary}</span>{" "}
                  <span className="text-muted-foreground">({i.category})</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <Link
                href="/resolutions"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                Open Resolutions
              </Link>{" "}
              to approve recovery and send the client email with payment links.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
