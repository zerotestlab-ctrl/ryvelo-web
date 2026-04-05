"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { createProfileIfMissing } from "@/app/actions/create-profile";

type Props = {
  children: React.ReactNode;
};

/**
 * Waits for Clerk, then runs `createProfileIfMissing` (idempotent) so the Supabase
 * `profiles` row exists before the server dashboard renders; refreshes when created.
 */
export function DashboardProfileShell({ children }: Props) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [profileGateDone, setProfileGateDone] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      setProfileGateDone(true);
      return;
    }

    let cancelled = false;
    void createProfileIfMissing().then((r) => {
      if (cancelled) return;
      if (r.ok && r.created) {
        router.refresh();
      }
      setProfileGateDone(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, router]);

  if (!isLoaded || !profileGateDone) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center"
        aria-busy
        aria-label="Creating profile"
      >
        <Loader2 className="h-9 w-9 animate-spin text-accent" aria-hidden />
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">Creating profile…</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Preparing your workspace. This only takes a moment.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
