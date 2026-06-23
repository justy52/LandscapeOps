import { auth } from "@clerk/nextjs/server";
import { CreateOrganization, OrganizationList } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { userId, orgId } = await auth();

  // Unauthenticated users should not reach onboarding
  if (!userId) redirect("/sign-in");

  // User already has an active org — send them to the app
  if (orgId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-landscape-navy flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-landscape-brass">
            <span className="text-lg font-black text-landscape-graphite">LO</span>
          </div>
          <h1 className="text-2xl font-semibold text-landscape-cream">
            Set up your workspace
          </h1>
          <p className="mt-2 text-sm text-landscape-cream/60 leading-relaxed">
            Create a new LandscapeOps organization or select an existing one to continue.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Shows existing org memberships if any */}
          <OrganizationList
            hidePersonal
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />

          <p className="text-landscape-cream/30 text-xs">or start fresh</p>

          <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}
