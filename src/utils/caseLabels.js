/**
 * Presentation helpers only: themed wording and formatting for BACKEND values.
 * Nothing here decides or computes a verification result.
 */

// Backend status value -> detective-themed wording. Edit wording here only.
export const STATUS_LABELS = {
  queued: "Awaiting examination",
  processing: "Under investigation",
  completed: "Investigation completed",
  failed: "Investigation unsuccessful",
};

export const statusLabel = (status) => STATUS_LABELS[status] ?? (status ? String(status) : "Status unknown");

export const STATUS_FILTERS = [
  { value: "all", label: "All cases" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

export const formatPercent = (value, digits = 1) =>
  typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(digits)}%` : "—";

/**
 * ASSUMPTION: confidence arrives as 0-1. Values above 1 are treated as already a percentage.
 * @returns {number|null}
 */
export const confidenceToPercent = (c) =>
  typeof c === "number" && Number.isFinite(c) ? (c <= 1 ? c * 100 : c) : null;

/**
 * Colour hint for the verdict text the VERIFICATION backend supplied (genuine / forged /
 * inconclusive). We only style the backend's own wording; the verdict is never derived from
 * the similarity score in the frontend.
 */
export const verdictTone = (verdict) => {
  const s = String(verdict ?? "").toLowerCase();
  if (!s) return "neutral";
  if (/(forg|fraud|not|mismatch|reject)/.test(s)) return "negative";
  if (/(genuine|authentic|match|accept)/.test(s)) return "positive";
  return "neutral"; // e.g. inconclusive
};

export const TONE_CLASS = {
  positive: "text-forest",
  negative: "text-oxblood",
  neutral: "text-ink",
};
