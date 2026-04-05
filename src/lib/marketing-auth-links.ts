import { clerkPublicAuthConfig } from "@/lib/clerk-public-config";

/**
 * Marketing CTAs: in **production**, use canonical `https://eternova.xyz/...` sign-in/up.
 * In development, same-origin `/sign-in` keeps local testing on localhost.
 */
export function marketingSignInUrl(): string {
  return process.env.NODE_ENV === "production"
    ? clerkPublicAuthConfig.signInUrl
    : "/sign-in";
}

export function marketingSignUpUrl(): string {
  return process.env.NODE_ENV === "production"
    ? clerkPublicAuthConfig.signUpUrl
    : "/sign-up";
}
