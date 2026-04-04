/**
 * Public Clerk URLs — mirrors NEXT_PUBLIC_CLERK_* in `.env.local` / Vercel.
 * Used by `ClerkProvider`, `<SignIn />`, and `<SignUp />` so dev and production stay aligned.
 */
export const clerkPublicAuthConfig = {
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
  signInFallbackRedirectUrl:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? "/dashboard",
  signUpFallbackRedirectUrl:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? "/dashboard",
} as const;
