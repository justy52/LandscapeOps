export const ESTIMATE_STATUS_VALUES = [
  "DRAFT",
  "INTERNAL_REVIEW",
  "SENT",
  "APPROVED",
  "DECLINED",
  "EXPIRED",
] as const;

export type EstimateStatusValue = (typeof ESTIMATE_STATUS_VALUES)[number];

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatusValue, string> = {
  DRAFT: "Draft",
  INTERNAL_REVIEW: "Internal review",
  SENT: "Sent",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export const ESTIMATE_STATUS_TRANSITIONS = {
  DRAFT: ["INTERNAL_REVIEW", "SENT"],
  INTERNAL_REVIEW: ["DRAFT", "SENT"],
  SENT: ["APPROVED", "DECLINED", "EXPIRED"],
  APPROVED: [],
  DECLINED: [],
  EXPIRED: [],
} as const satisfies Record<EstimateStatusValue, readonly EstimateStatusValue[]>;

export function isEstimateStatusValue(status: string): status is EstimateStatusValue {
  return ESTIMATE_STATUS_VALUES.includes(status as EstimateStatusValue);
}

export function getEstimateStatusTransitions(status: string) {
  if (!isEstimateStatusValue(status)) return [];
  return ESTIMATE_STATUS_TRANSITIONS[status];
}

export function getEstimateStatusLabel(status: string) {
  if (!isEstimateStatusValue(status)) return status;
  return ESTIMATE_STATUS_LABELS[status];
}
