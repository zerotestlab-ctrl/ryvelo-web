"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { createProfileIfMissing } from "@/app/actions/create-profile";

/**
 * Runs once per session after Clerk loads — ensures `profiles` exists (sign-up redirect + direct links).
 */
export function ProfileBootstrap() {
  const { isLoaded, userId } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (!isLoaded || !userId || ran.current) return;
    ran.current = true;
    void createProfileIfMissing().catch(() => {
      /* non-fatal; user can retry on next navigation */
    });
  }, [isLoaded, userId]);

  return null;
}
