import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createEstimateAction } from "@/app/actions/crm";
import { AppShell } from "@/components/app-shell";
import { EstimateForm } from "@/components/crm/estimate-form";
import { requireRole } from "@/lib/auth/roles";
import { listCustomers } from "@/lib/services/customers";
import { listLeads } from "@/lib/services/leads";

export default async function NewEstimatePage() {
  const { orgId } = await requireRole("MANAGER");
  const [customers, leads] = await Promise.all([
    listCustomers(orgId, { limit: 100 }),
    listLeads(orgId, { limit: 100 }),
  ]);

  return (
    <AppShell activeHref="/dashboard/crm/estimates" contentId="new-estimate-content">
      <section
        id="new-estimate-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <Link
          href="/dashboard/crm/estimates"
          className="inline-flex items-center gap-2 text-sm font-semibold text-landscape-cream/70 transition hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Estimates
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal md:text-4xl">
          New estimate
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
          Create a draft pricing record tied to an existing customer.
        </p>
      </section>

      <section className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
        <EstimateForm
          action={createEstimateAction}
          customers={customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            companyName: customer.companyName,
          }))}
          leads={leads.map((lead) => ({ id: lead.id, title: lead.title }))}
          submitLabel="Create estimate"
          mode="create"
        />
      </section>
    </AppShell>
  );
}
