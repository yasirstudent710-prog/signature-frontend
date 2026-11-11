import { useEffect, useState } from "react";
import { extractErrorMessage } from "../api/axios";
import { isTerminalStatus } from "../api/taskStatus";

const POLL_INTERVAL_MS = 2500; // every 2-3 seconds
const MAX_CONSECUTIVE_ERRORS = 5; // give up (and surface the error) after this many failures in a row

/**
 * Generic polling MECHANISM shared by both modules (like a shared Celery config, it knows
 * nothing about detection or verification). Each module binds its OWN status function via
 * useDetectionPolling / useVerificationPolling, so the two never call each other's endpoints.
 *
 * - Chained setTimeout (not setInterval): the next request is only scheduled after the
 *   previous one finished, so requests never overlap or duplicate.
 * - Cleanup (taskId change / unmount) clears the timer and aborts the in-flight request.
 * - Stops on completed/failed. Transient errors are retried; after MAX_CONSECUTIVE_ERRORS
 *   (or on 404/401) it stops and reports `error`; `retry()` restarts.
 *
 * @param {string|null} taskId  falsy => idle, nothing is requested
 * @param {(taskId: string, opts: {signal: AbortSignal}) => Promise<object>} fetchStatus
 *        MUST be a stable reference (module-level function)
 */
export default function useTaskPolling(taskId, fetchStatus) {
  const [state, setState] = useState({ taskId: null, task: null, error: null });
  const [attempt, setAttempt] = useState(0); // bump to restart polling after a failure

  useEffect(() => {
    if (!taskId) return undefined;

    let cancelled = false;
    let timer = null;
    let controller = null;
    let errorCount = 0;

    const poll = async () => {
      controller = new AbortController();
      try {
        const task = await fetchStatus(taskId, { signal: controller.signal });
        if (cancelled) return;
        errorCount = 0;
        setState({ taskId, task, error: null });
        if (!isTerminalStatus(task.status)) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled || err?.code === "ERR_CANCELED") return;
        errorCount += 1;
        const status = err?.response?.status;
        const fatal = status === 404 || status === 401 || errorCount >= MAX_CONSECUTIVE_ERRORS;
        if (fatal) {
          setState((s) => ({
            taskId,
            task: s.taskId === taskId ? s.task : null,
            error: status === 404 ? "This task was not found." : extractErrorMessage(err),
          }));
        } else {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [taskId, attempt, fetchStatus]);

  // Ignore state that belongs to a previous task id.
  const current = state.taskId === taskId ? state : { task: null, error: null };
  const isPolling = Boolean(taskId) && !current.error && !isTerminalStatus(current.task?.status);

  return {
    task: current.task,
    error: current.error,
    isPolling,
    retry: () => {
      setState((s) => ({ ...s, error: null }));
      setAttempt((n) => n + 1);
    },
  };
}
