import Link from "next/link";

// force-dynamic prevents build-time pre-rendering which would run ClerkProvider
// without NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY during next build.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-landscape-navy flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-landscape-brass">404</p>
        <h1 className="mt-4 text-xl font-semibold text-landscape-cream">Page not found</h1>
        <p className="mt-2 text-sm text-landscape-cream/60">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-landscape-brass px-5 py-2.5 text-sm font-semibold text-landscape-graphite hover:bg-[#c59844]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
