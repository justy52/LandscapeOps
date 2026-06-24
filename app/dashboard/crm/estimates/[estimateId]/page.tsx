import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  FileText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { transitionEstimateStatusAction } from "@/app/actions/crm";
import { AppShell } from "@/components/app-shell";
import { EstimateTransitionPanel } from "@/components/crm/estimate-form";
import { StatusBadge } from "@/components/crm/status-badge";
import { formatCents, formatDate, formatPercent } from "@/lib/format";
import { requireRole } from "@/lib/auth/roles";
import { getEstimate } from "@/lib/services/estimates";

function canEdit(status: string) {
  return status === "DRAFT" || status === "INTERNAL_REVIEW";
}

export default async function EstimateDetailPage({
  params,
}: {
  params: { estimateId: string };
}) {
  const { orgId } = await requireRole("MANAGER");
  const estimate = await getEstimate(orgId, params.estimateId);

  if (!estimate) notFound();

  const transitionAction = transitionEstimateStatusAction.bind(null, estimate.id);

  return (
    <AppShell activeHref="/dashboard/crm/estimates" contentId="estimate-detail-content">
      <section
        id="estimate-detail-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <Link
          href="/dashboard/crm/estimates"
          className="inline-flex items-center gap-2 text-sm font-semibold text-landscape-cream/70 transition hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Estimates
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-landscape-brass">{estimate.number}</p>
              <StatusBadge status={estimate.status} type="estimate" />
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-4xl">
              {estimate.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
              {estimate.customer.name}
              {estimate.lead ? ` / ${estimate.lead.title}` : ""}
            </p>
          </div>
          {canEdit(estimate.status) ? (
            <Link
              href={`/dashboard/crm/estimates/${estimate.id}/edit`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-landscape-brass px-4 text-sm font-semibold text-landscape-graphite transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              Edit draft
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-3" aria-label="Estimate totals">
            <div className="premium-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
                  <WalletCards className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500">Subtotal</p>
                  <p className="text-2xl font-semibold text-landscape-graphite">
                    {formatCents(estimate.subtotalCents)}
                  </p>
                </div>
              </div>
            </div>
            <div className="premium-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-brass text-landscape-graphite">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500">Tax</p>
                  <p className="text-2xl font-semibold text-landscape-graphite">
                    {formatCents(estimate.taxCents)}
                  </p>
                </div>
              </div>
            </div>
            <div className="premium-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950 text-sky-100">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500">Total</p>
                  <p className="text-2xl font-semibold text-landscape-graphite">
                    {formatCents(estimate.totalCents)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                  Estimate record
                </p>
                <h2 className="mt-2 text-xl font-semibold text-landscape-graphite">
                  Pricing summary
                </h2>
              </div>
              <p className="text-sm font-semibold text-stone-500">
                Margin {formatPercent(estimate.marginPercent)}
              </p>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-stone-200 bg-white/76 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Customer
                </dt>
                <dd className="mt-2 font-semibold text-landscape-graphite">
                  {estimate.customer.name}
                </dd>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white/76 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Lead
                </dt>
                <dd className="mt-2 font-semibold text-landscape-graphite">
                  {estimate.lead?.title ?? "No linked lead"}
                </dd>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white/76 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Created
                </dt>
                <dd className="mt-2 font-semibold text-landscape-graphite">
                  {formatDate(estimate.createdAt)}
                </dd>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white/76 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Sent / approved
                </dt>
                <dd className="mt-2 font-semibold text-landscape-graphite">
                  {estimate.sentAt ? formatDate(estimate.sentAt) : "Not sent"}
                  {estimate.approvedAt ? ` / ${formatDate(estimate.approvedAt)}` : ""}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="premium-card h-fit p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
            Status
          </p>
          <h2 className="mt-2 text-xl font-semibold text-landscape-graphite">
            Transition
          </h2>
          <div className="mt-4">
            <EstimateTransitionPanel
              action={transitionAction}
              currentStatus={estimate.status}
            />
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
