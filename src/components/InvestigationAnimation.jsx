import { AlertCircle, Check, RotateCcw, Search, X } from "lucide-react";
import Ornament from "./Ornament";
import StatusBadge from "./StatusBadge";
import { statusLabel } from "../utils/caseLabels";

/**
 * Investigation screen for a task that is NOT completed yet (queued / processing / failed),
 * plus the "could not reach the archive" state when polling itself fails.
 *
 * PRESENTATION ONLY. All props come from useVerificationPolling via the parent; this
 * component makes no requests and holds no task state. Every visual is derived from the
 * backend `status`:
 *   queued     -> stage 1 done, examination waiting, no motion
 *   processing -> examination stages shown as "in progress" together + scanning animation
 *   failed     -> failure panel
 * The backend only reports an overall status, so we do NOT claim which sub-stage is running
 * and show NO percentage. `task.message` is displayed verbatim.
 */
// backend status -> per-stage visual state: done | waiting | active | pending | failed
// `n` = number of stages in this module's ledger (see utils/stages.js).
const stageStates = (status, n) => {
  const middle = Math.max(0, n - 2);
  switch (status) {
    case "queued": return ["done", "waiting", ...Array(n - 2).fill("pending")];
    case "processing": return ["done", ...Array(middle).fill("active"), "pending"];
    case "completed": return Array(n).fill("done");
    case "failed": return ["done", ...Array(middle).fill("pending"), "failed"];
    default: return Array(n).fill("pending"); // no response yet: claim nothing
  }
};

function StageMarker({ state, index }) {
  const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium";
  if (state === "done") return <span className={`${base} border-forest bg-forest text-ivory`}><Check className="h-4 w-4" /></span>;
  if (state === "failed") return <span className={`${base} border-oxblood bg-oxblood text-ivory`}><X className="h-4 w-4" /></span>;
  if (state === "active") return <span className={`${base} anim-pulse border-burgundy bg-burgundy/10 text-burgundy`}>{index + 1}</span>;
  if (state === "waiting") return <span className={`${base} border-dashed border-brass-dark text-brass-dark`}>{index + 1}</span>;
  return <span className={`${base} border-ink/20 text-ink/40`}>{index + 1}</span>;
}

const Panel = ({ tone, title, children }) => (
  <div className={`paper p-5 sm:p-6 ${tone === "danger" ? "border-oxblood/60" : ""}`} role="alert">
    <div className="flex items-start gap-3">
      <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-oxblood" />
      <div className="min-w-0 flex-1">
        <p className="label !text-oxblood">{title}</p>
        {children}
      </div>
    </div>
  </div>
);

/** @param stages  the module's display ledger, e.g. DETECTION_STAGES (utils/stages.js) */
export default function InvestigationAnimation({ taskId, task, pollError, onRetry, onPollRetry, stages }) {
  const STAGES = stages;
  if (pollError) {
    return (
      <Panel tone="danger" title="Archive unreachable">
        <h2 className="mt-1 text-xl font-semibold text-burgundy">We could not check on this case</h2>
        <p className="mt-2 text-sm text-ink/80">{pollError}</p>
        <p className="mono mt-2 break-all text-xs text-ink/60">Case {taskId}</p>
        <button onClick={onPollRetry} className="btn-ghost mt-4"><RotateCcw className="h-4 w-4" /> Check again</button>
      </Panel>
    );
  }

  if (task?.status === "failed") {
    return (
      <Panel tone="danger" title="Investigation status">
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-burgundy">Investigation unsuccessful</h2>
          <span className="stamp anim-stamp text-oxblood">Unsuccessful</span>
        </div>
        <p className="mt-2 text-sm text-ink/80">
          {task.error?.message || task.message || "The system reported a failure without further details."}
        </p>
        <p className="mono mt-2 break-all text-xs text-ink/60">
          Case {task.taskId}{task.error?.code ? ` · ${task.error.code}` : ""}
        </p>
        <button onClick={onRetry} className="btn-ghost mt-4"><RotateCcw className="h-4 w-4" /> Try again</button>
      </Panel>
    );
  }

  const status = task?.status ?? null;
  const states = stageStates(status, STAGES.length);
  const scanning = status === "processing";
  const heading =
    status === "queued" ? "Your evidence is logged and awaiting an examiner."
    : status === "processing" ? "The forensic examination is underway."
    : status ? statusLabel(status)
    : "Retrieving the case file…";

  return (
    <section className="paper p-5 sm:p-7" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label">Investigation status</p>
          <h2 className="mt-1 text-2xl font-semibold text-burgundy">{heading}</h2>
          <p className="mono mt-1 break-all text-xs text-ink/60">Case {taskId}</p>
        </div>
        {status && <StatusBadge status={status} />}
      </div>

      <Ornament className="my-5" />

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* The case file under examination */}
        <div className="relative mx-auto h-60 w-48 -rotate-2 overflow-hidden rounded-sm border border-brass/60 bg-ivory shadow-md md:mx-0" aria-hidden="true">
          <div className="space-y-2.5 p-4 pt-6">
            {[90, 100, 72, 96, 60, 84, 40].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-ink/12" style={{ width: `${w}%` }} />
            ))}
          </div>
          <svg viewBox="0 0 120 30" className="absolute bottom-6 left-4 w-28 text-burgundy/70" fill="none">
            <path d="M4 20c6-16 10-16 12-4s6 8 10-6 8-4 10 4 7 3 12-3 9 2 14 0 8-6 14-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {scanning && <span className="anim-scan" />}
          {scanning && <Search className="anim-lens absolute left-6 top-8 h-16 w-16 text-brass-dark drop-shadow" strokeWidth={1.4} />}
          {status === "queued" && <span className="stamp anim-stamp absolute right-3 top-3 text-[10px] text-brass-dark">Received</span>}
        </div>

        {/* Stage ledger, driven by the real status */}
        <div>
          <ol className="space-y-3">
            {STAGES.map((s, i) => (
              <li key={s.title} className={`flex items-start gap-3 ${states[i] === "pending" ? "opacity-55" : ""}`}>
                <StageMarker state={states[i]} index={i} />
                <div className="min-w-0 pt-0.5">
                  <p className={`text-sm font-medium ${states[i] === "active" ? "text-burgundy" : "text-ink"}`}>{s.title}</p>
                  <p className="text-xs text-ink/60">{s.note}</p>
                </div>
              </li>
            ))}
          </ol>

          {task?.message && (
            <p className="mt-5 border-l-2 border-brass pl-3 text-sm italic text-ink/80">
              <span className="label not-italic">Examiner&rsquo;s note</span>
              <br />
              {task.message}
            </p>
          )}
          {scanning && (
            <p className="mt-3 text-xs text-ink/55">
              The system reports overall status only, so individual stage progress and completion time are not shown.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
