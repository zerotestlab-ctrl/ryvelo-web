import { createClient } from "@supabase/supabase-js";

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
