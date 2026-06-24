import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  updateLeadAction,
  updateLeadStatusAction,
} from "@/app/actions/crm";
import { AppShell } from "@/components/app-shell";
import { LeadForm, LeadStatusForm } from "@/components/crm/lead-form";
import { StatusBadge } from "@/components/crm/status-badge";
import { centsToDollarInput, dateToInputValue } from "@/lib/format";
import { requireRole } from "@/lib/auth/roles";
import { listCustomers } from "@/lib/services/customers";
import { getLead } from "@/lib/services/leads";

export default async function EditLeadPage({
  params,
}: {
  params: { leadId: string };
}) {
  const { orgId } = await requireRole("MANAGER");
  const [lead, customers] = await Promise.all([
    getLead(orgId, params.leadId),
    listCustomers(orgId, { limit: 100 }),
  ]);

  if (!lead) notFound();

  const updateAction = updateLeadAction.bind(null, lead.id);
  const statusAction = updateLeadStatusAction.bind(null, lead.id);

  return (
    <AppShell activeHref="/dashboard/crm/leads" contentId="edit-lead-content">
      <section
        id="edit-lead-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <Link
          href="/dashboard/crm/leads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-landscape-cream/70 transition hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Leads
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">{lead.title}</h1>
          <StatusBadge status={lead.status} type="lead" />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
          Keep follow-up, property context, and estimate readiness current.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
          <LeadForm
            action={updateAction}
            customers={customers.map((customer) => ({
              id: customer.id,
              name: customer.name,
              companyName: customer.companyName,
            }))}
            lead={{
              title: lead.title,
              source: lead.source,
              budgetDollars: centsToDollarInput(lead.budgetCents),
              siteAddress: lead.siteAddress,
              nextActionAt: dateToInputValue(lead.nextActionAt),
              notes: lead.notes,
              customerId: lead.customerId,
              status: lead.status,
            }}
            submitLabel="Save lead"
          />
        </div>

        <aside className="premium-card h-fit p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
            Pipeline
          </p>
          <h2 className="mt-2 text-xl font-semibold text-landscape-graphite">Status</h2>
          <div className="mt-4">
            <LeadStatusForm action={statusAction} currentStatus={lead.status} />
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
