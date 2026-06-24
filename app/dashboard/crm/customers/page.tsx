import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/crm/empty-state";
import { requireRole } from "@/lib/auth/roles";
import { listCustomers } from "@/lib/services/customers";

function customerLocation(customer: {
  city: string | null;
  state: string | null;
  postalCode: string | null;
}) {
  return [customer.city, customer.state, customer.postalCode].filter(Boolean).join(", ");
}

export default async function CustomersPage() {
  const { orgId } = await requireRole("MANAGER");
  const customers = await listCustomers(orgId, { limit: 50 });
  const withEmail = customers.filter((customer) => customer.email).length;
  const withAddress = customers.filter(
    (customer) => customer.addressLine1 || customer.city || customer.state
  ).length;

  return (
    <AppShell activeHref="/dashboard/crm/customers" contentId="customers-content">
      <section
        id="customers-content"
        className="dark-panel rounded-lg border border-white/10 p-5 text-landscape-cream md:p-7"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-landscape-brass">
              CRM
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-4xl">
              Customers
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
              Account records for residential, HOA, and commercial work.
            </p>
          </div>
          <Link
            href="/dashboard/crm/customers/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-landscape-brass px-4 text-sm font-semibold text-landscape-graphite transition hover:bg-[#c59844] focus:outline-none focus:ring-2 focus:ring-landscape-brass"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New customer
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Customer summary">
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">Total customers</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950 text-sky-100">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">With email</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{withEmail}</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-landscape-brass text-landscape-graphite">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-500">With property</p>
              <p className="text-2xl font-semibold text-landscape-graphite">{withAddress}</p>
            </div>
          </div>
        </div>
      </section>

      {customers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No customers yet"
          description="Create the first account record before linking leads or estimates."
          actionHref="/dashboard/crm/customers/new"
          actionLabel="Add customer"
        />
      ) : (
        <section
          className="premium-surface rounded-lg border border-landscape-cream/80 p-4 md:p-5"
          aria-labelledby="customer-list-title"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-landscape-brass">
                Customer list
              </p>
              <h2 id="customer-list-title" className="mt-2 text-xl font-semibold text-landscape-graphite">
                Active account records
              </h2>
            </div>
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-lg border border-stone-200 bg-white/78 lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-100/80 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3 text-right">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-landscape-graphite">{customer.name}</p>
                      <p className="mt-1 text-sm text-stone-500">
                        {customer.companyName ?? "Residential account"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-stone-600">
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-landscape-pine" aria-hidden="true" />
                          {customer.email ?? "No email"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-landscape-pine" aria-hidden="true" />
                          {customer.phone ?? "No phone"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-stone-700">
                        {customer.addressLine1 ?? "No street address"}
                      </p>
                      <p className="mt-1 text-stone-500">
                        {customerLocation(customer) || "No city/state"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/crm/customers/${customer.id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-landscape-graphite transition hover:border-landscape-brass/60 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
                      >
                        Edit
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 lg:hidden">
            {customers.map((customer) => (
              <article key={customer.id} className="premium-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-landscape-graphite">{customer.name}</h3>
                    <p className="mt-1 text-sm text-stone-500">
                      {customer.companyName ?? "Residential account"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/crm/customers/${customer.id}/edit`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-landscape-graphite transition hover:border-landscape-brass/60 focus:outline-none focus:ring-2 focus:ring-landscape-brass"
                    aria-label={`Edit ${customer.name}`}
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-stone-600">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-landscape-pine" aria-hidden="true" />
                    {customer.email ?? "No email"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-landscape-pine" aria-hidden="true" />
                    {customer.phone ?? "No phone"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-landscape-pine" aria-hidden="true" />
                    {customer.addressLine1 || customerLocation(customer) || "No property address"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
