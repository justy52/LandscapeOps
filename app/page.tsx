import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { PremiumHeader } from "@/components/premium-header";
import { dashboardMetrics, modulePreview, schedulePreview } from "@/lib/constants";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Leaf,
  Plus,
  Route,
  WalletCards
} from "lucide-react";

const statusStyles = {
  green: "bg-emerald-600",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  red: "bg-rose-500"
};

export default function Home() {
  return (
    <AppShell>
      <PremiumHeader
        eyebrow="Phase 0 dashboard preview"
        title="Run every landscape operation from one command center."
        description="Pipeline, estimating, field work, invoices, and profitability signals are arranged for fast daily decisions."
        actions={
          <>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-landscape-brass px-4 text-sm font-semibold text-landscape-graphite shadow-inset transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass focus:ring-offset-2 focus:ring-offset-landscape-navy">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New lead
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/16 bg-white/8 px-4 text-sm font-semibold text-landscape-cream transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-landscape-brass">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Estimate
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard metrics">
        {dashboardMetrics.map((metric) => (
          <DashboardCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="premium-surface rounded-lg border border-landscape-cream/80 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                Revenue workflow
              </p>
              <h2 className="mt-2 text-xl font-semibold text-landscape-graphite">Sales to production pulse</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md bg-landscape-pine px-3 py-2 text-sm font-semibold text-landscape-cream">
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              18% margin lift
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {modulePreview.slice(0, 3).map((item) => (
              <article key={item.name} className="rounded-lg border border-stone-200 bg-white/72 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-md bg-landscape-pine/10 p-2 text-landscape-pine">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-landscape-brass/12 px-2.5 py-1 text-xs font-semibold text-landscape-brass">
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-landscape-graphite">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.summary}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="premium-surface rounded-lg border border-landscape-cream/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                Today
              </p>
              <h2 className="mt-2 text-xl font-semibold text-landscape-graphite">Crew schedule</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-landscape-pine" aria-hidden="true" />
          </div>

          <div className="mt-6 space-y-3">
            {schedulePreview.map((visit) => (
              <article key={visit.site} className="rounded-lg border border-stone-200 bg-white/74 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-landscape-graphite">{visit.site}</p>
                    <p className="mt-1 text-sm text-stone-600">{visit.crew}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                    <span className={`status-dot ${statusStyles[visit.color]}`} />
                    {visit.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-stone-600">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {visit.time}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-surface rounded-lg border border-landscape-cream/80 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
              Operating modules
            </p>
            <h2 className="mt-2 text-xl font-semibold text-landscape-graphite">Built for the full job lifecycle</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-600">
            Phase 0 shows the navigation shape before live auth, database queries, or workflow automation are enabled.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modulePreview.map((item) => (
            <article key={item.name} className="rounded-lg border border-stone-200 bg-white/72 p-4">
              <item.icon className="h-5 w-5 text-landscape-pine" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-landscape-graphite">{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-landscape-brass/50 bg-landscape-pine/8 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
          <Leaf className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-landscape-graphite">No live organization data yet</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Real Clerk organizations, org-scoped Prisma queries, R2 files, payments, signatures, and notifications will be connected after Phase 0 architecture review.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-stone-700">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Tenant isolation planned
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
            <Route className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            Field workflow ready
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
            <WalletCards className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Finance guardrails documented
          </span>
        </div>
      </section>
    </AppShell>
  );
}
