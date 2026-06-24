import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerForm } from "@/components/crm/customer-form";
import { createCustomerAction } from "@/app/actions/crm";
import { requireRole } from "@/lib/auth/roles";

export default async function NewCustomerPage() {
  await requireRole("MANAGER");

  return (
    <AppShell activeHref="/dashboard/crm/customers" contentId="new-customer-content">
      <section
        id="new-customer-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <Link
          href="/dashboard/crm/customers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-landscape-cream/70 transition hover:text-landscape-cream focus:outline-none focus:ring-2 focus:ring-landscape-brass"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Customers
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal md:text-4xl">
          New customer
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
          Create the account record used by leads and estimates.
        </p>
      </section>

      <section className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
        <CustomerForm action={createCustomerAction} submitLabel="Create customer" />
      </section>
    </AppShell>
  );
}
