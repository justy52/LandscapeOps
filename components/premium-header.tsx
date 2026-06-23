import type { ReactNode } from "react";

type PremiumHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PremiumHeader({ eyebrow, title, description, actions }: PremiumHeaderProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-landscape-navy px-5 py-6 text-landscape-cream shadow-premium md:px-7 md:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-landscape-brass">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-normal md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-landscape-cream/72">{description}</p>
        </div>
        {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
      </div>
    </section>
  );
}
