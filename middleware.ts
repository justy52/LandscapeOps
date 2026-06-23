import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Resolve auth state once per request
  const authState = await auth();
  const { userId, orgId } = authState;
  const { pathname } = req.nextUrl;

  // Redirect authenticated users with an active org away from the landing page
  if (pathname === "/" && userId && orgId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect authenticated users without an active org from landing to onboarding
  if (pathname === "/" && userId && !orgId) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (isPublicRoute(req)) return NextResponse.next();

  // All other routes require authentication
  if (!userId) {
    return authState.redirectToSignIn({ returnBackUrl: req.url });
  }

  // All app routes (except onboarding) require an active org
  if (!orgId && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
