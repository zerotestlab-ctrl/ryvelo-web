/**
 * Clerk auth URLs for production on **eternova.xyz** (Eternova).
 * Hard-coded so hosted sign-in/up and redirects always target the live custom domain.
 *
 * Use `pk_live_*` / `sk_live_*` in production env (see `assertClerkPublishableKeyForProduction`).
 */
export const ETERNOVA_APP_ORIGIN = "https://eternova.xyz" as const;

export const clerkPublicAuthConfig = {
  /** Public site origin (custom domain). */
  origin: ETERNOVA_APP_ORIGIN,

  /** Full URLs for ClerkProvider + cross-links (always eternova.xyz). */
  signInUrl: `${ETERNOVA_APP_ORIGIN}/sign-in`,
  signUpUrl: `${ETERNOVA_APP_ORIGIN}/sign-up`,

  /** Path segments for `<SignIn />` / `<SignUp />` with `routing="path"` (must be paths, not full URLs). */
  signInPath: "/sign-in",
  signUpPath: "/sign-up",

  /**
   * Post-auth landing — always `/dashboard` on the current host (local or eternova.xyz).
   * Do not hard-code the marketing domain here or redirects break in development.
   */
  signInFallbackRedirectUrl: "/dashboard",
  signUpFallbackRedirectUrl: "/dashboard",
} as const;
