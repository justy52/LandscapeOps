import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateCustomerAction } from "@/app/actions/crm";
import { AppShell } from "@/components/app-shell";
import { CustomerForm } from "@/components/crm/customer-form";
import { requireRole } from "@/lib/auth/roles";
import { getCustomer } from "@/lib/services/customers";

export default async function EditCustomerPage({
  params,
}: {
  params: { customerId: string };
}) {
  const { orgId } = await requireRole("MANAGER");
  const customer = await getCustomer(orgId, params.customerId);

  if (!customer) notFound();

  const action = updateCustomerAction.bind(null, customer.id);

  return (
    <AppShell activeHref="/dashboard/crm/customers" contentId="edit-customer-content">
      <section
        id="edit-customer-content"
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
          {customer.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-landscape-cream/70">
          Update the account record used by active sales work.
        </p>
      </section>

      <section className="premium-surface rounded-lg border border-landscape-cream/80 p-5 md:p-6">
        <CustomerForm
          action={action}
          customer={{
            name: customer.name,
            companyName: customer.companyName,
            email: customer.email,
            phone: customer.phone,
            addressLine1: customer.addressLine1,
            addressLine2: customer.addressLine2,
            city: customer.city,
            state: customer.state,
            postalCode: customer.postalCode,
            notes: customer.notes,
          }}
          submitLabel="Save customer"
        />
      </section>
    </AppShell>
  );
}
