import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateEstimateAction } from "@/app/actions/crm";
import { AppShell } from "@/components/app-shell";
import { EstimateForm } from "@/components/crm/estimate-form";
import { StatusBadge } from "@/components/crm/status-badge";
import {
  centsToDollarInput,
  percentToInputValue,
} from "@/lib/format";
import { requireRole } from "@/lib/auth/roles";
import { getEstimate } from "@/lib/services/estimates";

export default async function EditEstimatePage({
  params,
}: {
  params: { estimateId: string };
}) {
  const { orgId } = await requireRole("MANAGER");
  const estimate = await getEstimate(orgId, params.estimateId);

  if (!estimate) notFound();

  const action = updateEstimateAction.bind(null, estimate.id);

  return (
    <AppShell activeHref="/dashboard/crm/estimates" contentId="edit-estimate-content">
      <section
        id="edit-estimate-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <Link
          href={`/dashboard/crm/estimates/${estimate.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-landscape-cream/70 transition hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Estimate
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-landscape-brass">{estimate.number}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">
              Edit estimate
            </h1>
          </div>
          <StatusBadge status={estimate.status} type="estimate" />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
          Update draft pricing fields before client delivery.
        </p>
      </section>

      <section className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
        <EstimateForm
          action={action}
          customers={[]}
          estimate={{
            title: estimate.title,
            subtotalDollars: centsToDollarInput(estimate.subtotalCents),
            taxDollars: centsToDollarInput(estimate.taxCents),
            marginPercent: percentToInputValue(estimate.marginPercent),
          }}
          submitLabel="Save estimate"
          mode="edit"
        />
      </section>
    </AppShell>
  );
}
