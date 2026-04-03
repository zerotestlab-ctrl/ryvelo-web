"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Stable synthetic email per Clerk user — avoids colliding with real Supabase email signups. */
function shadowSupabaseEmail(clerkUserId: string) {
  const safe = clerkUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 48);
  return `${safe || "user"}-${clerkUserId.slice(-8)}@clerk.ryvelo.internal`;
}

export type CreateProfileResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: string };

/**
 * Ensures a `profiles` row exists for the signed-in Clerk user.
 * `profiles.id` references `auth.users.id`, so we create a shadow Supabase Auth user first.
 */
export async function createProfileIfMissing(): Promise<CreateProfileResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, reason: "Not signed in" };
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
    .eq("clerk_id", userId)
    .maybeSingle();

  if (selectError) {
    return { ok: false, reason: selectError.message };
  }
  if (existing) {
    return { ok: true, created: false };
  }

  const clerkUser = await currentUser();
  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.username ||
    "User";

  const email = shadowSupabaseEmail(userId);

  const { data: createdAuth, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { clerk_id: userId },
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
        (u) => u.email === email || u.user_metadata?.clerk_id === userId
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
    clerk_id: userId,
    full_name: fullName,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: true, created: false };
    }
    return { ok: false, reason: insertError.message };
  }

  return { ok: true, created: true };
}
