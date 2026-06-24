export function formatCents(cents?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export function centsToDollarInput(cents?: number | null) {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

export function formatDate(date?: Date | string | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function dateToInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function formatPercent(value?: unknown) {
  if (value === null || value === undefined) return "No margin";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "No margin";
  return `${numeric.toFixed(1).replace(/\.0$/, "")}%`;
}

export function percentToInputValue(value?: unknown) {
  if (value === null || value === undefined) return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "";
  return numeric.toString();
}
