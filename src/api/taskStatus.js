/**
 * Task status vocabulary shared by BOTH modules (detection and verification).
 * This is infrastructure (the async-task lifecycle), not business logic: the two modules
 * return different results, but both report the same four lifecycle states.
 * ASSUMPTION: both backend task pipelines use exactly these status strings.
 */
export const STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

export const isTerminalStatus = (s) => s === STATUS.COMPLETED || s === STATUS.FAILED;

// Timeouts shared by both modules' API files.
export const UPLOAD_TIMEOUT_MS = 120000; // covers the file upload only, not the ML work
export const STATUS_TIMEOUT_MS = 10000;
