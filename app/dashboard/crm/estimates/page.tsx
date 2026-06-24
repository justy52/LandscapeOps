import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Plus,
  Send,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/crm/empty-state";
import { StatusBadge } from "@/components/crm/status-badge";
import { formatCents, formatDate, formatPercent } from "@/lib/format";
import { requireRole } from "@/lib/auth/roles";
import { listEstimates } from "@/lib/services/estimates";

function isOpenEstimate(status: string) {
  return status === "DRAFT" || status === "INTERNAL_REVIEW" || status === "SENT";
}

export default async function EstimatesPage() {
  const { orgId } = await requireRole("MANAGER");
  const estimates = await listEstimates(orgId, { limit: 100 });
  const inReview = estimates.filter((estimate) => estimate.status === "INTERNAL_REVIEW").length;
  const sent = estimates.filter((estimate) => estimate.status === "SENT").length;
  const openValue = estimates
    .filter((estimate) => isOpenEstimate(estimate.status))
    .reduce((sum, estimate) => sum + estimate.totalCents, 0);

  return (
    <AppShell activeHref="/dashboard/crm/estimates" contentId="estimates-content">
      <section
        id="estimates-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-landscape-brass">
              Estimating
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-4xl">
              Estimates
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
              Draft pricing, review states, client-sent estimates, and approval outcomes.
            </p>
          </div>
          <Link
            href="/dashboard/crm/estimates/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-landscape-brass px-4 text-sm font-semibold text-landscape-graphite transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New estimate
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Estimate summary">
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
              <WalletCards className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Open value</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{formatCents(openValue)}</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-brass text-landscape-graphite">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Internal review</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{inReview}</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950 text-sky-100">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Sent</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{sent}</p>
            </div>
          </div>
        </div>
      </section>

      {estimates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No estimates yet"
          description="Create a draft estimate after a qualified lead or customer request."
          actionHref="/dashboard/crm/estimates/new"
          actionLabel="Add estimate"
        />
      ) : (
        <section
          className="premium-surface rounded-lg border border-landscape-cream/80 p-4 md:p-5"
          aria-labelledby="estimate-list-title"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                Estimate list
              </p>
              <h2 id="estimate-list-title" className="mt-2 text-xl font-semibold text-landscape-graphite">
                Pricing records
              </h2>
            </div>
            <p className="text-sm font-semibold text-stone-500">{estimates.length} total estimates</p>
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-lg border border-stone-200 bg-white/78 lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-100/80 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                <tr>
                  <th className="px-4 py-3">Estimate</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Margin</th>
                  <th className="px-4 py-3 text-right">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {estimates.map((estimate) => (
                  <tr key={estimate.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-landscape-graphite">{estimate.number}</p>
                      <p className="mt-1 text-stone-500">{estimate.title}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-stone-700">{estimate.customer.name}</p>
                      <p className="mt-1 text-stone-500">{formatDate(estimate.createdAt)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={estimate.status} type="estimate" />
                    </td>
                    <td className="px-4 py-4 font-semibold text-landscape-graphite">
                      {formatCents(estimate.totalCents)}
                    </td>
                    <td className="px-4 py-4 text-stone-600">
                      {formatPercent(estimate.marginPercent)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/crm/estimates/${estimate.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-landscape-graphite transition hover:border-landscape-brass/60 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 lg:hidden">
            {estimates.map((estimate) => (
              <article key={estimate.id} className="premium-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-500">{estimate.number}</p>
                    <h3 className="mt-1 font-semibold text-landscape-graphite">{estimate.title}</h3>
                  </div>
                  <StatusBadge status={estimate.status} type="estimate" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-stone-500">Customer</p>
                    <p className="mt-1 text-landscape-graphite">{estimate.customer.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-500">Total</p>
                    <p className="mt-1 text-landscape-graphite">{formatCents(estimate.totalCents)}</p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/crm/estimates/${estimate.id}`}
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-landscape-graphite transition hover:border-landscape-brass/60 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
                >
                  Open
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
