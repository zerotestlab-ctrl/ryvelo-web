"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { createProfileIfMissing } from "@/app/actions/create-profile";

const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/invoices",
  "/resolutions",
  "/analytics",
  "/settings",
] as const;

function isAppShellPath(path: string | null): boolean {
  if (!path) return false;
  return APP_SHELL_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Ensures a Supabase `profiles` row exists for the signed-in Clerk user on every
 * app-shell navigation. Idempotent server action; refreshes RSC when the profile
 * was just created or when landing on the dashboard so downstream data always
 * sees a real `profiles` row.
 */
export function ProfileBootstrap() {
  const { isLoaded, userId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !userId) return;
    if (!isAppShellPath(pathname)) return;

    void createProfileIfMissing().then((r) => {
      if (!r.ok) return;
      if (r.created) {
        router.refresh();
      }
    });
  }, [isLoaded, userId, pathname, router]);

  return null;
}
