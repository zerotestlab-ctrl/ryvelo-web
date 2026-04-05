/**
 * Production Clerk (Eternova / eternova.xyz) — validates publishable key at runtime.
 * Call from the root layout (server) so misconfiguration fails fast in production builds.
 */
export function assertClerkPublishableKeyForProduction(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production for Clerk on eternova.xyz."
    );
  }
  if (!key.startsWith("pk_live_")) {
    console.warn(
      "[Clerk] Production build uses NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY that does not start with pk_live_. " +
        "Use live keys from the Clerk production instance for eternova.xyz."
    );
  }
}
