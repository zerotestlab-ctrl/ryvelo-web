"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createProfileIfMissing } from "@/app/actions/create-profile";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

type Props = {
  children: React.ReactNode;
};

/**
 * Clerk must finish loading before dashboard chrome is meaningful.
 * Also runs `createProfileIfMissing` once after load (idempotent) so the workspace
 * row exists even if the server render raced; refreshes when a row was created.
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
    return <DashboardSkeleton />;
  }

  return <>{children}</>;
}
