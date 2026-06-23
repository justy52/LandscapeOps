import type { ReactNode } from "react";
import { requireActiveOrg } from "@/lib/auth/require-active-org";

// Force dynamic rendering — this layout resolves auth from the Clerk session,
// which requires a live request. Do not statically generate.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Resolves active org from Clerk session server-side.
  // Redirects to /sign-in (no session) or /onboarding (no active org or webhook lag).
  await requireActiveOrg();

  return <>{children}</>;
}
