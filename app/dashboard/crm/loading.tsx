import { AppShell } from "@/components/app-shell";

export default function CrmLoading() {
  return (
    <AppShell activeHref="/dashboard/crm/customers" contentId="crm-loading">
      <section id="crm-loading" className="space-y-5">
        <div className="dark-panel rounded-lg border border-white/10 p-6 text-landscape-cream">
          <div className="h-3 w-36 rounded-full bg-landscape-brass/40" />
          <div className="mt-4 h-9 w-full max-w-xl rounded-md bg-white/12" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-white/10" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="premium-card p-5">
              <div className="h-4 w-24 rounded-full bg-stone-200" />
              <div className="mt-4 h-8 w-16 rounded-md bg-stone-200" />
              <div className="mt-4 h-3 w-full rounded-full bg-stone-200" />
            </div>
          ))}
        </div>
        <div className="premium-surface rounded-lg border border-landscape-cream/80 p-5">
          <div className="space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-14 rounded-md bg-stone-200/70" />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
