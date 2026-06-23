import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { navigationItems } from "@/lib/constants";
import { Bell, ChevronDown, Search, ShieldCheck } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-landscape-cream/95 text-landscape-graphite">
      <div className="min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
        <aside className="hidden border-r border-white/10 bg-landscape-navy text-landscape-cream lg:block">
          <div className="flex h-full min-h-screen flex-col px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-brass text-sm font-black text-landscape-graphite shadow-inset">
                LO
              </div>
              <div>
                <p className="text-sm font-semibold">LandscapeOps</p>
                <p className="text-xs text-landscape-cream/58">Executive workspace</p>
              </div>
            </div>

            <nav className="mt-10 space-y-1" aria-label="Primary navigation">
              {navigationItems.map((item, index) => (
                <a
                  key={item.name}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-landscape-cream/68 transition hover:bg-white/8 hover:text-landscape-cream",
                    index === 0 && "bg-white/10 text-landscape-cream"
                  )}
                  href={item.href}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </a>
              ))}
            </nav>

            <div className="mt-auto rounded-lg border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-landscape-brass" aria-hidden="true" />
                Org-scoped by design
              </div>
              <p className="mt-2 text-xs leading-5 text-landscape-cream/62">
                Every production query must be tied to the active Clerk organization.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/12 bg-landscape-navy/96 px-4 py-4 text-landscape-cream backdrop-blur md:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-landscape-brass text-xs font-black text-landscape-graphite">
                  LO
                </div>
                <span className="text-sm font-semibold">LandscapeOps</span>
              </div>

              <div className="hidden min-h-11 flex-1 items-center gap-3 rounded-md border border-white/10 bg-white/8 px-3 text-sm text-landscape-cream/62 md:flex">
                <Search className="h-4 w-4" aria-hidden="true" />
                Search leads, jobs, invoices, and customers
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/8 text-landscape-cream transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </button>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/8 px-3 text-sm font-semibold text-landscape-cream transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-landscape-brass">
                  High Mesa
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav className="mx-auto mt-4 flex max-w-7xl gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Mobile navigation">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md bg-white/8 px-3 text-sm font-medium text-landscape-cream/78"
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </a>
              ))}
            </nav>
          </header>

          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
