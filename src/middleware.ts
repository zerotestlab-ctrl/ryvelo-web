import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

if (process.env.NODE_ENV === "production") {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!pk) {
    throw new Error(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production (Clerk on eternova.xyz)."
    );
  }
  if (!pk.startsWith("pk_live_")) {
    console.warn(
      "[middleware][Clerk] Use pk_live_* publishable key for production / eternova.xyz."
    );
  }
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)"
],
};
