/**
 * Display-only stage ledgers, one per module. They are NOT backend data: the backend only
 * reports an overall status (queued/processing/completed/failed). Edit wording here only.
 */
export const DETECTION_STAGES = [
  { title: "Evidence received", note: "The document has been logged." },
  { title: "Document examination", note: "The page is inspected for markings." },
  { title: "Signature detection", note: "Signatures are located on the page." },
  { title: "Detection report filed", note: "The locations are recorded." },
];

export const VERIFICATION_STAGES = [
  { title: "Evidence received", note: "Both signatures have been logged." },
  { title: "Signature preparation", note: "The images are prepared for study." },
  { title: "Reference comparison", note: "The suspected signature is compared to the original." },
  { title: "Verdict assessment", note: "The findings are weighed." },
  { title: "Verification report filed", note: "The verdict is recorded." },
];
