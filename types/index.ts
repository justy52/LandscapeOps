export type ModuleKey =
  | "leads"
  | "estimates"
  | "jobs"
  | "schedule"
  | "fieldOps"
  | "invoices"
  | "reports";

export type TenantScoped = {
  orgId: string;
};

export type MoneyCents = number;

export type StatusTone = "green" | "amber" | "blue" | "red" | "neutral";

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
};
