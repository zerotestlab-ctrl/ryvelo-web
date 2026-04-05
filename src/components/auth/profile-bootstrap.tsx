"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { createProfileIfMissing } from "@/app/actions/create-profile";

/**
 * Ensures a `profiles` row exists after Clerk loads and on each app navigation
 * (including every dashboard load). Calls `createProfileIfMissing` (server action).
 * Idempotent — refreshes the server tree when a row was created.
 */
export function ProfileBootstrap() {
  const { isLoaded, userId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !userId) return;

    void createProfileIfMissing().then((r) => {
      if (r.ok && r.created) {
        router.refresh();
      }
    });
  }, [isLoaded, userId, pathname, router]);

  return null;
}
