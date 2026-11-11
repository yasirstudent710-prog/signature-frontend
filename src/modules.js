/**
 * Registry of the two independent modules, used ONLY by shared list/navigation UI
 * (archives tabs, recent-case lists). It maps each module to its OWN history function and
 * its OWN route; it contains no detection/verification business logic.
 */
import { getDetectionHistory } from "./api/detectionApi";
import { getVerificationHistory } from "./api/verificationApi";
import { formatPercent, verdictTone } from "./utils/caseLabels";

export const MODULES = {
  detection: {
    key: "detection",
    title: "Signature Detection",
    path: "/detection",
    fetchHistory: getDetectionHistory,
    // module-specific facts shown on an archived case
    facts: (i) => [{ label: "Signatures found", value: i.signatureCount ?? "—" }],
  },
  verification: {
    key: "verification",
    title: "Signature Verification",
    path: "/verification",
    fetchHistory: getVerificationHistory,
    facts: (i) => [
      { label: "Similarity", value: formatPercent(i.similarityScore) },
      { label: "Verdict", value: i.verdict ?? "—", tone: verdictTone(i.verdict) },
    ],
  },
};

export const MODULE_LIST = Object.values(MODULES);
