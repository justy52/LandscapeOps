import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createLeadAction } from "@/app/actions/crm";
import { AppShell } from "@/components/app-shell";
import { LeadForm } from "@/components/crm/lead-form";
import { requireRole } from "@/lib/auth/roles";
import { listCustomers } from "@/lib/services/customers";

export default async function NewLeadPage() {
  const { orgId } = await requireRole("MANAGER");
  const customers = await listCustomers(orgId, { limit: 100 });

  return (
    <AppShell activeHref="/dashboard/crm/leads" contentId="new-lead-content">
      <section
        id="new-lead-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <Link
          href="/dashboard/crm/leads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-landscape-cream/70 transition hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Leads
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal md:text-4xl">
          New lead
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
          Capture source, site context, budget, and next action.
        </p>
      </section>

      <section className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
        <LeadForm
          action={createLeadAction}
          customers={customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            companyName: customer.companyName,
          }))}
          submitLabel="Create lead"
        />
      </section>
    </AppShell>
  );
}
