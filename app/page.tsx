import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { PremiumHeader } from "@/components/premium-header";
import {
  commandPriorities,
  dashboardMetrics,
  fieldOpsPreview,
  modulePreview,
  pipelinePreview,
  readinessSignals,
  schedulePreview
} from "@/lib/constants";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Leaf,
  MapPinned,
  Plus,
  Route,
  ShieldCheck,
  WalletCards
} from "lucide-react";

const statusStyles = {
  green: "bg-emerald-600",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  red: "bg-rose-500",
  neutral: "bg-stone-400"
};

const toneStyles = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  neutral: "bg-stone-100 text-stone-700 ring-stone-200"
};

const moduleAnchors: Record<string, string> = {
  Leads: "leads",
  Estimates: "estimates",
  Jobs: "jobs",
  Schedule: "schedule",
  "Field Ops": "field-ops",
  Invoices: "invoices",
  Reports: "reports",
  "Site Files": "site-files"
};

export default function Home() {
  return (
    <AppShell>
      <PremiumHeader
        eyebrow="Phase 0 dashboard preview"
        title="A premium command center for landscape operators."
        description="Pipeline, crews, site files, invoices, AR, and margin signals are staged for fast owner and ops-manager decisions."
        actions={
          <>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-landscape-brass px-4 text-sm font-semibold text-landscape-graphite shadow-inset transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass focus:ring-offset-2 focus:ring-offset-landscape-navy"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New lead
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/16 bg-white/8 px-4 text-sm font-semibold text-landscape-cream transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Draft estimate
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard metrics">
        {dashboardMetrics.map((metric) => (
          <DashboardCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]" aria-labelledby="command-center-title">
        <div className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                Today&apos;s priorities
              </p>
              <h2 id="command-center-title" className="mt-2 text-2xl font-semibold tracking-normal">
                Command center
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-xs font-semibold text-landscape-cream/72 ring-1 ring-white/10">
              <ShieldCheck className="h-3.5 w-3.5 text-landscape-brass" aria-hidden="true" />
              Static demo data
            </span>
          </div>

          <div className="mt-6 divide-y divide-white/10">
            {commandPriorities.map((priority) => (
              <article key={priority.title} className="py-4 first:pt-0 last:pb-0">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/8 text-landscape-brass ring-1 ring-white/10">
                    <priority.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="font-semibold leading-6 text-landscape-cream">{priority.title}</h3>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneStyles[priority.tone]}`}
                      >
                        {priority.owner}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-landscape-cream/66">{priority.detail}</p>
                    <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-landscape-cream/54">
                      <Clock3 className="h-3.5 w-3.5 text-landscape-brass" aria-hidden="true" />
                      {priority.due}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="premium-surface soft-grid rounded-lg border border-landscape-cream/80 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                Revenue workflow
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-landscape-graphite">Sales to production pulse</h2>
            </div>
            <div className="rounded-lg bg-landscape-pine px-3 py-2 text-right text-landscape-cream">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-landscape-cream/62">Margin</p>
              <p className="text-lg font-semibold">41%</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {pipelinePreview.map((stage) => (
              <div key={stage.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-landscape-graphite">{stage.label}</span>
                  <span className="font-semibold text-stone-500">{stage.value}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-200/80" aria-hidden="true">
                  <div className={`h-2 rounded-full ${stage.tone}`} style={{ width: stage.width }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {readinessSignals.map((signal) => (
              <div key={signal.label} className="rounded-lg border border-stone-200 bg-white/72 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-landscape-pine/10 text-landscape-pine">
                    <signal.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-landscape-graphite">{signal.label}</p>
                    <p className="mt-1 text-sm leading-5 text-stone-600">{signal.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]" aria-labelledby="schedule-title">
        <div id="schedule" className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">Schedule</p>
              <h2 id="schedule-title" className="mt-2 text-2xl font-semibold text-landscape-graphite">
                Crew dispatch preview
              </h2>
            </div>
            <CalendarDays className="h-6 w-6 text-landscape-pine" aria-hidden="true" />
          </div>

          <div className="mt-6 space-y-3">
            {schedulePreview.map((visit) => (
              <article key={visit.site} className="rounded-lg border border-stone-200 bg-white/78 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-landscape-graphite">{visit.site}</p>
                      <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                        <span className={`status-dot ${statusStyles[visit.color]}`} />
                        {visit.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      <span className="font-semibold text-stone-700">{visit.crew}</span> - {visit.scope}
                    </p>
                  </div>

                  <div className="grid min-w-44 gap-2 text-sm font-medium text-stone-600">
                    <span className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-landscape-pine" aria-hidden="true" />
                      {visit.time}
                    </span>
                    <span className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-landscape-pine" aria-hidden="true" />
                      {visit.route}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div id="field-ops" className="space-y-5">
          <div className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">Field ops</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal">Jobsite signals</h2>
              </div>
              <MapPinned className="h-6 w-6 text-landscape-brass" aria-hidden="true" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {fieldOpsPreview.map((item) => (
                <article key={item.label} className="rounded-lg border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-landscape-brass/14 text-landscape-brass">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{item.value}</p>
                      <p className="text-sm font-semibold text-landscape-cream/70">{item.label}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-5 text-landscape-cream/58">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
              Operating modules
            </p>
            <h2 id="modules-title" className="mt-2 text-2xl font-semibold text-landscape-graphite">
              Built around the full job lifecycle
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-600">
            Phase 0 keeps these modules as static preview surfaces while the tenant-safe auth core stays in planning.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modulePreview.map((item) => (
            <article
              key={item.name}
              id={moduleAnchors[item.name]}
              className="premium-card group p-4 transition hover:-translate-y-0.5 hover:border-landscape-brass/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-pine/10 text-landscape-pine">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="rounded-full bg-landscape-brass/12 px-2.5 py-1 text-xs font-semibold text-landscape-brass">
                  {item.status}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-landscape-graphite">{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.summary}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-landscape-pine">
                Preview
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-landscape-brass/50 bg-landscape-pine/8 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
          <Leaf className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-landscape-graphite">Phase 0 demo workspace</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Live Clerk organizations, org-scoped Prisma reads, R2 files, payments, signatures, and notifications remain deferred to later phases.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-stone-700">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Tenant isolation planned
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200">
            <Route className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            Field workflow previewed
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200">
            <WalletCards className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Finance guardrails documented
          </span>
        </div>
      </section>
    </AppShell>
  );
}
