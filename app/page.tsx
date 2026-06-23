import Link from "next/link";
import { Leaf } from "lucide-react";

// Middleware redirects authenticated users before they reach this page
// (active org → /dashboard, no org → /onboarding).
// force-dynamic prevents build-time pre-rendering, which would run ClerkProvider
// without NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-landscape-navy flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-landscape-brass">
          <Leaf className="h-8 w-8 text-landscape-graphite" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-semibold text-landscape-cream tracking-tight">
          LandscapeOps
        </h1>
        <p className="mt-3 text-landscape-cream/62 leading-relaxed text-sm">
          Premium operations platform for landscape contractors.
        </p>

        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-landscape-brass px-6 text-sm font-semibold text-landscape-graphite shadow-inset transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass focus:ring-offset-2 focus:ring-offset-landscape-navy"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/16 bg-white/8 px-6 text-sm font-semibold text-landscape-cream transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
