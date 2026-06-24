import type { ActionState } from "@/lib/action-state";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;

  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
      role="status"
    >
      {state.message}
    </div>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;

  return <p className="mt-1 text-xs font-medium text-rose-700">{errors[0]}</p>;
}
