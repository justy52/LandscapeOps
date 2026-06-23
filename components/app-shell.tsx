import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { navigationItems } from "@/lib/constants";
import { OrgSwitcher } from "@/components/org-switcher";
import { UserButton } from "@/components/user-button";
import { Bell, Search, ShieldCheck } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-landscape-cream/95 text-landscape-graphite">
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-landscape-brass focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-landscape-graphite"
      >
        Skip to dashboard
      </a>

      <div className="min-h-screen lg:grid lg:grid-cols-[19rem_1fr]">
        <aside className="hidden border-r border-white/10 bg-landscape-navy text-landscape-cream lg:block">
          <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/8 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-landscape-brass text-sm font-black text-landscape-graphite shadow-inset">
                LO
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">LandscapeOps</p>
                <p className="truncate text-xs text-landscape-cream/58">High Mesa demo org</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-[#0d151b] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">Command</p>
                <span className="rounded-full bg-emerald-500/12 px-2 py-1 text-[0.68rem] font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
                  Demo live
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">$428K</p>
              <p className="mt-1 text-xs leading-5 text-landscape-cream/62">Open pipeline across residential, HOA, and commercial work.</p>
            </div>

            <nav className="mt-7 space-y-1" aria-label="Primary navigation">
              {navigationItems.map((item, index) => (
                <a
                  key={item.name}
                  aria-current={index === 0 ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-landscape-cream/68 transition hover:bg-white/8 hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass",
                    index === 0 && "bg-white/12 text-landscape-cream shadow-inset"
                  )}
                  href={item.href}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md bg-white/6 text-landscape-cream/64 transition group-hover:bg-landscape-brass/16 group-hover:text-landscape-brass",
                      index === 0 && "bg-landscape-brass text-landscape-graphite"
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {item.name}
                </a>
              ))}
            </nav>

            <div className="mt-auto space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/8 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-landscape-brass" aria-hidden="true" />
                  Tenant-safe posture
                </div>
                <p className="mt-2 text-xs leading-5 text-landscape-cream/62">
                  Phase 0 stays static while Phase 1 defines Clerk org resolution and org-scoped data access.
                </p>
              </div>
              <div className="rounded-lg border border-landscape-brass/20 bg-landscape-brass/10 px-4 py-3 text-xs font-semibold text-landscape-brass">
                Security review required before merge or deploy.
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/12 bg-landscape-navy/96 px-4 py-4 text-landscape-cream backdrop-blur-xl md:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-landscape-brass text-xs font-black text-landscape-graphite">
                  LO
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">LandscapeOps</p>
                  <p className="truncate text-xs text-landscape-cream/56">High Mesa demo</p>
                </div>
              </div>

              <div
                className="hidden min-h-11 flex-1 items-center gap-3 rounded-md border border-white/10 bg-white/8 px-3 text-sm text-landscape-cream/62 ring-1 ring-white/5 md:flex"
                role="search"
                aria-label="Static dashboard search preview"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search leads, jobs, invoices, site files
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/8 text-landscape-cream transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </button>
                {/* Live Clerk org switcher — replaces Phase 0 static "High Mesa" button */}
                <OrgSwitcher />
                <UserButton />
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-28 pt-5 md:px-6 lg:px-8 lg:pb-8 lg:pt-8">
            {children}
          </div>
        </div>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-white/12 bg-landscape-navy/96 p-2 text-landscape-cream shadow-premium backdrop-blur-xl lg:hidden"
        aria-label="Mobile command navigation"
      >
        <div className="grid grid-cols-4 gap-1">
          {navigationItems.slice(0, 4).map((item, index) => (
            <a
              key={item.name}
              href={item.href}
              aria-current={index === 0 ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-2 text-[0.68rem] font-semibold text-landscape-cream/66 transition hover:bg-white/8 hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass",
                index === 0 && "bg-white/12 text-landscape-cream"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.name}
            </a>
          ))}
        </div>
      </nav>
    </main>
  );
}
