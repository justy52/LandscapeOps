"use client";

import { Save } from "lucide-react";
import { useFormState } from "react-dom";
import { emptyActionState, type ActionState } from "@/lib/action-state";
import { FieldError, FormMessage } from "@/components/crm/form-message";
import { SubmitButton } from "@/components/crm/submit-button";

type LeadFormAction = (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

export type CustomerOption = {
  id: string;
  name: string;
  companyName?: string | null;
};

export type LeadFormValues = {
  title?: string | null;
  source?: string | null;
  budgetDollars?: string | null;
  siteAddress?: string | null;
  nextActionAt?: string | null;
  notes?: string | null;
  customerId?: string | null;
  status?: string | null;
};

type LeadFormProps = {
  action: LeadFormAction;
  customers: CustomerOption[];
  lead?: LeadFormValues;
  submitLabel: string;
};

const leadStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "ESTIMATE_REQUESTED",
  "WON",
  "LOST",
];

const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  ESTIMATE_REQUESTED: "Estimate requested",
  WON: "Won",
  LOST: "Lost",
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-md border border-stone-300 bg-white/85 px-3 text-sm text-landscape-graphite shadow-sm outline-none transition placeholder:text-stone-400 focus:border-landscape-brass focus:ring-2 focus:ring-landscape-brass/25";

const textareaClass =
  "mt-1 min-h-28 w-full rounded-md border border-stone-300 bg-white/85 px-3 py-2 text-sm text-landscape-graphite shadow-sm outline-none transition placeholder:text-stone-400 focus:border-landscape-brass focus:ring-2 focus:ring-landscape-brass/25";

export function LeadForm({ action, customers, lead, submitLabel }: LeadFormProps) {
  const [state, formAction] = useFormState(action, emptyActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <div className="grid gap-4 md:grid-cols-[1fr_0.55fr]">
        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Lead title</span>
          <input
            name="title"
            required
            maxLength={255}
            defaultValue={lead?.title ?? ""}
            className={inputClass}
          />
          <FieldError errors={errors.title} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Source</span>
          <input
            name="source"
            maxLength={100}
            defaultValue={lead?.source ?? ""}
            className={inputClass}
          />
          <FieldError errors={errors.source} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Customer</span>
          <select name="customerId" defaultValue={lead?.customerId ?? ""} className={inputClass}>
            <option value="">Unassigned</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.companyName ? `${customer.name} - ${customer.companyName}` : customer.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors.customerId} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Budget</span>
          <input
            name="budgetDollars"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={lead?.budgetDollars ?? ""}
            className={inputClass}
          />
          <FieldError errors={errors.budgetCents} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Next action</span>
          <input
            name="nextActionAt"
            type="date"
            defaultValue={lead?.nextActionAt ?? ""}
            className={inputClass}
          />
          <FieldError errors={errors.nextActionAt} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-landscape-graphite">Site address</span>
        <input
          name="siteAddress"
          maxLength={500}
          defaultValue={lead?.siteAddress ?? ""}
          className={inputClass}
        />
        <FieldError errors={errors.siteAddress} />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-landscape-graphite">Notes</span>
        <textarea
          name="notes"
          maxLength={10000}
          defaultValue={lead?.notes ?? ""}
          className={textareaClass}
        />
        <FieldError errors={errors.notes} />
      </label>

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
        <SubmitButton label={submitLabel} pendingLabel="Saving lead" icon={Save} />
      </div>
    </form>
  );
}

export function LeadStatusForm({
  action,
  currentStatus,
}: {
  action: LeadFormAction;
  currentStatus: string;
}) {
  const [state, formAction] = useFormState(action, emptyActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} />
      <label className="block">
        <span className="text-sm font-semibold text-landscape-graphite">Pipeline status</span>
        <select name="status" defaultValue={currentStatus} className={inputClass}>
          {leadStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
        <FieldError errors={errors.status} />
      </label>
      <SubmitButton label="Update status" pendingLabel="Updating status" tone="secondary" />
    </form>
  );
}
