import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-landscape-brass/45 bg-landscape-pine/8 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-landscape-graphite">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">{description}</p>
      <Link
        href={actionHref}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-landscape-brass px-4 text-sm font-semibold text-landscape-graphite transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass focus:ring-offset-2 focus:ring-offset-landscape-cream"
      >
        {actionLabel}
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
