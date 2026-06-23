"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

export function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterSelectOrganizationUrl="/dashboard"
      afterCreateOrganizationUrl="/dashboard"
      afterLeaveOrganizationUrl="/"
      appearance={{
        elements: {
          rootBox: "flex items-center",
          organizationSwitcherTrigger:
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/8 px-3 text-sm font-semibold text-landscape-cream transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-landscape-brass",
        },
      }}
    />
  );
}
