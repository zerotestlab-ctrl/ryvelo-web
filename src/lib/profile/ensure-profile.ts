import { currentUser } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient, isSupabaseEnvConfigured } from "@/lib/supabase/admin";

/** Stable synthetic email per Clerk user — avoids colliding with real Supabase email signups. */
function shadowSupabaseEmail(clerkUserId: string) {
  const safe = clerkUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 48);
  return `${safe || "user"}-${clerkUserId.slice(-8)}@clerk.ryvelo.internal`;
}

export type EnsureProfileResult =
  | { ok: true; profileId: string; created: boolean }
  | { ok: false; reason: string };

/**
 * Ensures a `profiles` row exists for the given Clerk user id.
 * Safe to call from Server Components, Route Handlers, and ingest — idempotent.
 */
export async function ensureProfileForClerkUser(
  clerkUserId: string
): Promise<EnsureProfileResult> {
  if (!clerkUserId.trim()) {
    return { ok: false, reason: "Not signed in" };
  }

  if (!isSupabaseEnvConfigured()) {
    return {
      ok: false,
      reason:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase not configured";
    return { ok: false, reason: msg };
  }

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .maybeSingle();

  if (selectError) {
    return { ok: false, reason: selectError.message };
  }
  if (existing?.id) {
    return { ok: true, profileId: existing.id as string, created: false };
  }

  const clerkUser = await currentUser();
  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.username ||
    "User";

  const email = shadowSupabaseEmail(clerkUserId);

  const { data: createdAuth, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { clerk_id: clerkUserId },
    });

  let authUserId: string;

  if (authError) {
    const msg = authError.message?.toLowerCase() ?? "";
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      const { data: listData, error: listError } =
        await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) {
        return { ok: false, reason: listError.message };
      }
      const found = listData.users.find(
        (u) => u.email === email || u.user_metadata?.clerk_id === clerkUserId
      );
      if (!found) {
        return {
          ok: false,
          reason: "Could not create or resolve Supabase auth user",
        };
      }
      authUserId = found.id;
    } else {
      return { ok: false, reason: authError.message };
    }
  } else {
    authUserId = createdAuth.user!.id;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: authUserId,
    clerk_id: clerkUserId,
    full_name: fullName,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: again } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .maybeSingle();
      if (again?.id) {
        return { ok: true, profileId: again.id as string, created: false };
      }
    }
    return { ok: false, reason: insertError.message };
  }

  return { ok: true, profileId: authUserId, created: true };
}
