import { createClient } from "@supabase/supabase-js";

import { formatSubscriptionPlanLabel } from "@/lib/subscription";

/** True when URL and service role key are present (app can reach Supabase). */
export function isSupabaseEnvConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
}

/**
 * Service-role client for trusted server routes (Clerk session → explicit user scoping).
 * Never import in client components.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getProfileIdForClerkUser(clerkUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

/** Profile row fields needed for billing UI. */
export async function getProfileRowForClerkUser(clerkUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, subscription_plan")
    .eq("clerk_id", clerkUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id as string,
    subscription_plan: (data.subscription_plan as string | null) ?? "free",
  };
}

/** Display label for the top bar (defaults to Free if unauthenticated or no row). */
export async function getSubscriptionPlanLabelForClerkUser(
  clerkUserId: string | null
): Promise<string> {
  if (!clerkUserId) return "Free";
  try {
    const row = await getProfileRowForClerkUser(clerkUserId);
    return formatSubscriptionPlanLabel(row?.subscription_plan);
  } catch {
    return "Free";
  }
}
