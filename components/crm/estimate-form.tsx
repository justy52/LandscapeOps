"use client";

import { ArrowRight, Save } from "lucide-react";
import { useFormState } from "react-dom";
import { emptyActionState, type ActionState } from "@/lib/action-state";
import { FieldError, FormMessage } from "@/components/crm/form-message";
import type { CustomerOption } from "@/components/crm/lead-form";
import { SubmitButton } from "@/components/crm/submit-button";

type EstimateFormAction = (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

export type LeadOption = {
  id: string;
  title: string;
};

export type EstimateFormValues = {
  title?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  subtotalDollars?: string | null;
  taxDollars?: string | null;
  marginPercent?: string | null;
};

type EstimateFormProps = {
  action: EstimateFormAction;
  customers: CustomerOption[];
  leads?: LeadOption[];
  estimate?: EstimateFormValues;
  submitLabel: string;
  mode: "create" | "edit";
};

const estimateStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  INTERNAL_REVIEW: "Internal review",
  SENT: "Sent",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

const estimateTransitions: Record<string, string[]> = {
  DRAFT: ["INTERNAL_REVIEW", "SENT"],
  INTERNAL_REVIEW: ["DRAFT", "SENT"],
  SENT: ["APPROVED", "DECLINED", "EXPIRED"],
  APPROVED: [],
  DECLINED: [],
  EXPIRED: [],
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-md border border-stone-300 bg-white/85 px-3 text-sm text-landscape-graphite shadow-sm outline-none transition placeholder:text-stone-400 focus:border-landscape-brass focus:ring-2 focus:ring-landscape-brass/25";

export function EstimateForm({
  action,
  customers,
  leads = [],
  estimate,
  submitLabel,
  mode,
}: EstimateFormProps) {
  const [state, formAction] = useFormState(action, emptyActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <label className="block">
        <span className="text-sm font-semibold text-landscape-graphite">Estimate title</span>
        <input
          name="title"
          required
          maxLength={255}
          defaultValue={estimate?.title ?? ""}
          className={inputClass}
        />
        <FieldError errors={errors.title} />
      </label>

      {mode === "create" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-landscape-graphite">Customer</span>
            <select
              name="customerId"
              required
              defaultValue={estimate?.customerId ?? ""}
              className={inputClass}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName
                    ? `${customer.name} - ${customer.companyName}`
                    : customer.name}
                </option>
              ))}
            </select>
            <FieldError errors={errors.customerId} />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-landscape-graphite">Lead</span>
            <select name="leadId" defaultValue={estimate?.leadId ?? ""} className={inputClass}>
              <option value="">No linked lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.title}
                </option>
              ))}
            </select>
            <FieldError errors={errors.leadId} />
          </label>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Subtotal</span>
          <input
            name="subtotalDollars"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={estimate?.subtotalDollars ?? ""}
            className={inputClass}
          />
          <FieldError errors={errors.subtotalCents} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Tax</span>
          <input
            name="taxDollars"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={estimate?.taxDollars ?? ""}
            className={inputClass}
          />
          <FieldError errors={errors.taxCents} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Margin %</span>
          <input
            name="marginPercent"
            inputMode="decimal"
            placeholder="0"
            defaultValue={estimate?.marginPercent ?? ""}
            className={inputClass}
          />
          <FieldError errors={errors.marginPercent} />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
        <SubmitButton label={submitLabel} pendingLabel="Saving estimate" icon={Save} />
      </div>
    </form>
  );
}

export function EstimateTransitionPanel({
  action,
  currentStatus,
}: {
  action: EstimateFormAction;
  currentStatus: string;
}) {
  const [state, formAction] = useFormState(action, emptyActionState);
  const nextStatuses = estimateTransitions[currentStatus] ?? [];

  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        {nextStatuses.length > 0 ? (
          nextStatuses.map((status) => (
            <SubmitButton
              key={status}
              name="status"
              value={status}
              label={estimateStatusLabels[status]}
              pendingLabel="Updating"
              icon={ArrowRight}
              tone="secondary"
            />
          ))
        ) : (
          <span className="inline-flex min-h-11 items-center rounded-md border border-stone-200 bg-stone-100 px-4 text-sm font-semibold text-stone-600">
            {estimateStatusLabels[currentStatus] ?? currentStatus}
          </span>
        )}
      </div>
    </form>
  );
}
