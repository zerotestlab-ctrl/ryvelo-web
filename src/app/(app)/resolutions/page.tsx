import { auth } from "@clerk/nextjs/server";

import { ResolutionTable } from "@/components/resolutions/ResolutionTable";
import { getResolutionListForClerkUser } from "@/lib/data/resolutions-list";

export const dynamic = "force-dynamic";

export default async function ResolutionsPage() {
  const { userId } = await auth();
  const { rows, error } = await getResolutionListForClerkUser(userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Resolutions
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review AI-detected FX, tax, and compliance issues. Approve to run
            recovery: client email, Stripe success fee, and Wise remittance links.
          </p>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {rows.length} case{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      {error ? (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          {error}
        </div>
      ) : null}

      <ResolutionTable data={rows} />
    </div>
  );
}
