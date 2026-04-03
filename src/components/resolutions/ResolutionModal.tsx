"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveResolutionAction,
  rejectResolutionAction,
} from "@/app/actions/resolution-ui-actions";
import type { ResolutionListRow } from "@/lib/data/resolutions-list";

import { ResolutionTimeline } from "@/components/resolutions/ResolutionTimeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  row: ResolutionListRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function issueLines(issues: unknown): { title: string; detail: string }[] {
  if (!Array.isArray(issues)) return [];
  return issues
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      if (typeof o.description === "string") {
        return {
          title: String(o.type ?? o.category ?? "Issue"),
          detail: o.description,
        };
      }
      if (typeof o.summary === "string") {
        return {
          title: String(o.category ?? "Issue"),
          detail: [o.summary, o.detail].filter(Boolean).join(" — "),
        };
      }
      return null;
    })
    .filter((x): x is { title: string; detail: string } => x !== null);
}

export function ResolutionModal({ row, open, onOpenChange }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(false);

  const draftFromSteps = extractDraft(row?.aiSteps ?? []);

  function close() {
    setError(null);
    setEditDraft(false);
    onOpenChange(false);
  }

  function onApprove() {
    if (!row) return;
    setError(null);
    startTransition(async () => {
      const res = await approveResolutionAction(row.invoiceId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function onReject() {
    if (!row) return;
    setError(null);
    startTransition(async () => {
      const res = await rejectResolutionAction(row.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  if (!row) return null;

  const lines = issueLines(row.issuesDetected);
  const canAct = row.outcomeStatus === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-border/80 p-0 shadow-xl shadow-black/40">
        <DialogHeader className="border-b border-border/60 bg-card/40 px-6 py-5">
          <DialogTitle className="pr-8 text-lg font-semibold tracking-tight">
            {row.invoiceRef}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {row.clientName} · {row.statusLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-4">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Issues
            </h3>
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues listed.</p>
            ) : (
              <ul className="space-y-2">
                {lines.map((line, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border/80 bg-black/15 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">{line.title}</span>
                    <p className="mt-0.5 text-muted-foreground">{line.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Workflow
            </h3>
            <ResolutionTimeline steps={row.aiSteps} />
          </section>

          {editDraft && (
            <section className="mt-6 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chase email draft
              </h3>
              <textarea
                className={cn(
                  "min-h-[140px] w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                readOnly
                value={draftFromSteps}
              />
              <p className="text-xs text-muted-foreground">
                Editing sends is not wired yet — copy from here if needed.
              </p>
            </section>
          )}

          {error ? (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 bg-card/30 px-6 py-4 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setEditDraft((v) => !v)}
          >
            {editDraft ? "Hide draft" : "Edit draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-500/40 text-red-300 hover:bg-red-500/10"
            disabled={pending || !canAct}
            onClick={onReject}
          >
            Reject
          </Button>
          <Button
            type="button"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={pending || !canAct}
            onClick={onApprove}
          >
            {pending ? "Working…" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function extractDraft(steps: import("@/lib/agents/types").ResolutionStep[]): string {
  const rev = [...steps].reverse();
  const p = rev.find((s) => s.step === "propose_resolution");
  const out = p?.aiOutput as
    | {
        proposal?: { chaseEmailDraft?: string };
        fallback?: { chaseEmailDraft?: string };
      }
    | undefined;
  const draft =
    out?.proposal?.chaseEmailDraft ?? out?.fallback?.chaseEmailDraft;
  return typeof draft === "string" ? draft : "";
}
