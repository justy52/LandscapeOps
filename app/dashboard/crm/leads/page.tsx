import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  MapPin,
  Plus,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/crm/empty-state";
import { StatusBadge, statusLabel } from "@/components/crm/status-badge";
import { formatCents, formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/roles";
import { listLeads } from "@/lib/services/leads";

const leadStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "ESTIMATE_REQUESTED",
  "WON",
  "LOST",
] as const;

function isOpen(status: string) {
  return status !== "WON" && status !== "LOST";
}

export default async function LeadsPage() {
  const { orgId } = await requireRole("MANAGER");
  const leads = await listLeads(orgId, { limit: 100 });
  const openLeads = leads.filter((lead) => isOpen(lead.status));
  const estimateReady = leads.filter((lead) => lead.status === "ESTIMATE_REQUESTED").length;
  const overdue = leads.filter((lead) => {
    if (!lead.nextActionAt || !isOpen(lead.status)) return false;
    return new Date(lead.nextActionAt).getTime() < Date.now();
  }).length;

  return (
    <AppShell activeHref="/dashboard/crm/leads" contentId="leads-content">
      <section
        id="leads-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-landscape-brass">
              CRM
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-4xl">
              Lead pipeline
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
              Active sales work by follow-up stage, site context, and estimate readiness.
            </p>
          </div>
          <Link
            href="/dashboard/crm/leads/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-landscape-brass px-4 text-sm font-semibold text-landscape-graphite transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New lead
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Lead summary">
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Open leads</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{openLeads.length}</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-brass text-landscape-graphite">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Estimate ready</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{estimateReady}</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-950 text-rose-100">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Overdue actions</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{overdue}</p>
            </div>
          </div>
        </div>
      </section>

      {leads.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No leads yet"
          description="Capture the first inquiry with source, property, budget, and next action."
          actionHref="/dashboard/crm/leads/new"
          actionLabel="Add lead"
        />
      ) : (
        <section
          className="premium-surface rounded-lg border border-landscape-cream/80 p-4 md:p-5"
          aria-labelledby="lead-pipeline-title"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                Pipeline
              </p>
              <h2 id="lead-pipeline-title" className="mt-2 text-xl font-semibold text-landscape-graphite">
                Sales stages
              </h2>
            </div>
            <p className="text-sm font-semibold text-stone-500">{leads.length} total leads</p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-6">
            {leadStatuses.map((status) => {
              const columnLeads = leads.filter((lead) => lead.status === status);

              return (
                <div key={status} className="rounded-lg border border-stone-200 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={status} type="lead" />
                    <span className="text-sm font-semibold text-stone-500">{columnLeads.length}</span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {columnLeads.length === 0 ? (
                      <div className="rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm font-medium text-stone-500">
                        No {statusLabel(status).toLowerCase()} leads
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <article key={lead.id} className="rounded-md border border-stone-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-landscape-graphite">
                                {lead.title}
                              </h3>
                              <p className="mt-1 text-xs font-semibold text-stone-500">
                                {lead.customer?.name ?? "No customer"}
                              </p>
                            </div>
                            <Link
                              href={`/dashboard/crm/leads/${lead.id}/edit`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-landscape-graphite transition hover:border-landscape-brass/60 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
                              aria-label={`Edit ${lead.title}`}
                            >
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </div>

                          <div className="mt-3 space-y-2 text-xs font-medium text-stone-600">
                            <p>{lead.source ?? "No source"} / {formatCents(lead.budgetCents)}</p>
                            <p className="flex items-center gap-2">
                              <CalendarClock className="h-3.5 w-3.5 text-landscape-pine" aria-hidden="true" />
                              {formatDate(lead.nextActionAt)}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-landscape-pine" aria-hidden="true" />
                              {lead.siteAddress ?? "No site address"}
                            </p>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}
