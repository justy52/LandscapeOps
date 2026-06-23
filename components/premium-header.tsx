import type { ReactNode } from "react";
import { dayStats } from "@/lib/constants";

type PremiumHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PremiumHeader({ eyebrow, title, description, actions }: PremiumHeaderProps) {
  return (
    <section
      id="dashboard"
      className="relative overflow-hidden rounded-lg border border-white/10 bg-landscape-navy px-5 py-6 text-landscape-cream shadow-premium md:px-7 md:py-8"
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(183,138,56,0.14),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(127,146,121,0.22),transparent_28rem)]" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-landscape-brass">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-normal md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-landscape-cream/74">{description}</p>
        </div>
        {actions ? <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">{actions}</div> : null}
      </div>

      <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
        {dayStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 bg-white/8 p-4">
            <div className="flex items-center gap-2 text-landscape-cream/62">
              <stat.icon className="h-4 w-4 text-landscape-brass" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">{stat.label}</p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-landscape-cream">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
