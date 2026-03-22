// REQUIRED: Clerk Dashboard > Sessions > Edit JWT template
// Add custom claim: { "role": "{{user.public_metadata.role}}" }
// Without this, sessionClaims.role is undefined and role-based routing fails silently.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

const isBuyerRoute = createRouteMatcher(["/buyer(.*)"]);
const isSellerRoute = createRouteMatcher(["/seller(.*)"]);

function getDashboardPath(role: string | undefined): string {
  if (role === "buyer") return "/buyer/dashboard";
  if (role === "seller") return "/seller/dashboard";
  return "/onboarding";
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect all non-public routes — redirect unauthenticated users to sign-in
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = (sessionClaims as { role?: string })?.role;

  // Already-roled users should not re-onboard — redirect to their dashboard
  if (isOnboardingRoute(req) && role) {
    return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
  }

  // Enforce role-based routing — redirect mismatched roles to their correct dashboard
  if (isBuyerRoute(req) && role !== "buyer") {
    return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
  }

  if (isSellerRoute(req) && role !== "seller") {
    return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
