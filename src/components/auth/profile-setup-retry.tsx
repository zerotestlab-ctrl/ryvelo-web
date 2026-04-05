"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { createProfileIfMissing } from "@/app/actions/create-profile";

import { Button } from "@/components/ui/button";

type Props = {
  reason: string;
};

export function ProfileSetupRetry({ reason }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  function retry() {
    setLocalError(null);
    startTransition(async () => {
      const r = await createProfileIfMissing();
      if (!r.ok) {
        setLocalError(r.reason);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-6 text-sm text-amber-50"
      role="status"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" aria-hidden />
        <div className="min-w-0 space-y-3">
          <p className="font-medium text-foreground">Workspace setup needed</p>
          <p className="text-amber-100/90">{reason}</p>
          {localError ? (
            <p className="text-xs text-red-200" role="alert">
              {localError}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={retry}
            className="gap-2"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {pending ? "Retrying…" : "Retry setup"}
          </Button>
        </div>
      </div>
    </div>
  );
}
