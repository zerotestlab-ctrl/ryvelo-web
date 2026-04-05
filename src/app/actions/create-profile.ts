"use server";

import { auth } from "@clerk/nextjs/server";

import {
  ensureProfileForClerkUser,
  type EnsureProfileResult,
} from "@/lib/profile/ensure-profile";

export type CreateProfileResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: string };

function mapResult(r: EnsureProfileResult): CreateProfileResult {
  if (!r.ok) return { ok: false, reason: r.reason };
  return { ok: true, created: r.created };
}

/**
 * Ensures a `profiles` row exists for the signed-in Clerk user.
 * Used by client bootstrap and can be awaited from Server Components.
 */
export async function createProfileIfMissing(): Promise<CreateProfileResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, reason: "Not signed in" };
  }
  const r = await ensureProfileForClerkUser(userId);
  return mapResult(r);
}
