"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { createProfileIfMissing } from "@/app/actions/create-profile";

/**
 * Ensures a Supabase `profiles` row exists for the signed-in Clerk user.
 * Runs after Clerk loads and on **every navigation** (`pathname` in deps), so the
 * dashboard route always triggers `createProfileIfMissing` on load. Idempotent.
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
