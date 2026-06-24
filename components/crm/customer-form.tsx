"use client";

import { Save } from "lucide-react";
import { useFormState } from "react-dom";
import { emptyActionState, type ActionState } from "@/lib/action-state";
import { FieldError, FormMessage } from "@/components/crm/form-message";
import { SubmitButton } from "@/components/crm/submit-button";

type CustomerFormAction = (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

export type CustomerFormValues = {
  name?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  notes?: string | null;
};

type CustomerFormProps = {
  action: CustomerFormAction;
  customer?: CustomerFormValues;
  submitLabel: string;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-md border border-stone-300 bg-white/85 px-3 text-sm text-landscape-graphite shadow-sm outline-none transition placeholder:text-stone-400 focus:border-landscape-brass focus:ring-2 focus:ring-landscape-brass/25";

const textareaClass =
  "mt-1 min-h-28 w-full rounded-md border border-stone-300 bg-white/85 px-3 py-2 text-sm text-landscape-graphite shadow-sm outline-none transition placeholder:text-stone-400 focus:border-landscape-brass focus:ring-2 focus:ring-landscape-brass/25";

export function CustomerForm({ action, customer, submitLabel }: CustomerFormProps) {
  const [state, formAction] = useFormState(action, emptyActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Customer name</span>
          <input
            name="name"
            required
            maxLength={255}
            defaultValue={customer?.name ?? ""}
            className={inputClass}
            autoComplete="name"
          />
          <FieldError errors={errors.name} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Company</span>
          <input
            name="companyName"
            maxLength={255}
            defaultValue={customer?.companyName ?? ""}
            className={inputClass}
            autoComplete="organization"
          />
          <FieldError errors={errors.companyName} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Email</span>
          <input
            name="email"
            type="email"
            maxLength={255}
            defaultValue={customer?.email ?? ""}
            className={inputClass}
            autoComplete="email"
          />
          <FieldError errors={errors.email} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Phone</span>
          <input
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={customer?.phone ?? ""}
            className={inputClass}
            autoComplete="tel"
          />
          <FieldError errors={errors.phone} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_0.7fr]">
        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Address line 1</span>
          <input
            name="addressLine1"
            maxLength={255}
            defaultValue={customer?.addressLine1 ?? ""}
            className={inputClass}
            autoComplete="address-line1"
          />
          <FieldError errors={errors.addressLine1} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Address line 2</span>
          <input
            name="addressLine2"
            maxLength={255}
            defaultValue={customer?.addressLine2 ?? ""}
            className={inputClass}
            autoComplete="address-line2"
          />
          <FieldError errors={errors.addressLine2} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_0.55fr_0.55fr]">
        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">City</span>
          <input
            name="city"
            maxLength={100}
            defaultValue={customer?.city ?? ""}
            className={inputClass}
            autoComplete="address-level2"
          />
          <FieldError errors={errors.city} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">State</span>
          <input
            name="state"
            maxLength={50}
            defaultValue={customer?.state ?? ""}
            className={inputClass}
            autoComplete="address-level1"
          />
          <FieldError errors={errors.state} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-landscape-graphite">Postal code</span>
          <input
            name="postalCode"
            maxLength={20}
            defaultValue={customer?.postalCode ?? ""}
            className={inputClass}
            autoComplete="postal-code"
          />
          <FieldError errors={errors.postalCode} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-landscape-graphite">Notes</span>
        <textarea
          name="notes"
          maxLength={10000}
          defaultValue={customer?.notes ?? ""}
          className={textareaClass}
        />
        <FieldError errors={errors.notes} />
      </label>

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
        <SubmitButton label={submitLabel} pendingLabel="Saving customer" icon={Save} />
      </div>
    </form>
  );
}
