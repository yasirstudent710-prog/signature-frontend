import { AlertCircle, Loader2, Scale } from "lucide-react";
import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { extractErrorMessage } from "../api/axios";
import { isTerminalStatus } from "../api/taskStatus";
import { submitVerification } from "../api/verificationApi";
import FileUploader from "../components/FileUploader";
import InvestigationAnimation from "../components/InvestigationAnimation";
import Ornament from "../components/Ornament";
import VerificationReport from "../components/VerificationReport";
import useVerificationPolling from "../hooks/useVerificationPolling";
import { MODULES } from "../modules";
import { VERIFICATION_STAGES } from "../utils/stages";
import CaseHistory from "./CaseHistory";

/**
 * SIGNATURE VERIFICATION workspace. Two signature images in; similarity + verdict out.
 * Uses ONLY verificationApi (via useVerificationPolling). It never calls detection endpoints,
 * takes no document, and never computes a verdict (the backend's verdict is displayed).
 *
 * Backend state  : `task` (from the polling hook), `taskId` (kept in the URL as ?task=).
 * Frontend state : selected files, submit progress, `submittedCase`.
 */
export default function VerificationWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const taskId = searchParams.get("task");

  const [original, setOriginal] = useState(null);
  const [suspected, setSuspected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedCase, setSubmittedCase] = useState(null); // {id, at}

  const { task, error: pollError, retry: retryPolling } = useVerificationPolling(taskId);

  const canSubmit = Boolean(original && suspected) && !submitting;
  const isSubmittedHere = submittedCase?.id === taskId;
  const filedAt = task?.createdAt ?? location.state?.createdAt ?? (isSubmittedHere ? submittedCase.at : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitVerification(original, suspected); // returns a task id immediately
      if (!res.taskId) throw new Error("The server did not return a task ID.");
      setSubmittedCase({ id: res.taskId, at: new Date().toISOString() });
      setSearchParams({ task: res.taskId });
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "Could not submit the signatures for verification."));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setOriginal(null);
    setSuspected(null);
    setSubmitError(null);
    setSearchParams({});
  };
  const retryFailed = () => {
    setSubmitError(null);
    setSearchParams({}); // back to the form with the files kept
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="label">Signature verification</p>
        <h1 className="mt-1 text-4xl font-semibold text-burgundy">Compare Signatures</h1>
        <p className="mt-2 font-display text-lg italic text-ink/70">Is the suspected signature genuine? The verification model decides.</p>
      </header>

      {taskId ? (
        <div className="space-y-4">
          {task?.status === "completed" ? (
            <VerificationReport task={task} filedAt={filedAt} originalFile={isSubmittedHere ? original : null} suspectedFile={isSubmittedHere ? suspected : null} onReset={reset} />
          ) : (
            <>
              <InvestigationAnimation stages={VERIFICATION_STAGES} taskId={taskId} task={task} pollError={pollError} onRetry={retryFailed} onPollRetry={retryPolling} />
              {!isTerminalStatus(task?.status) && <button onClick={reset} className="btn-ghost">Close this view and open another case</button>}
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="paper paper-stack p-5 sm:p-8">
          <p className="label">Case intake</p>
          <h2 className="mt-1 text-2xl font-semibold text-burgundy sm:text-3xl">Submit Two Signatures for Verification</h2>
          <p className="mt-1.5 text-ink/75">Verification compares the two signatures only. No document is needed.</p>
          <Ornament className="my-6" />
          <div className="grid gap-8 md:grid-cols-2">
            <FileUploader kind="signature" exhibit="Exhibit A" label="Original Signature" description="Provide the genuine signature on record." file={original} onChange={setOriginal} disabled={submitting} />
            <FileUploader kind="signature" exhibit="Exhibit B" label="Suspected Signature" description="Upload the signature to be examined." file={suspected} onChange={setSuspected} disabled={submitting} />
          </div>
          {submitError && (
            <div className="mt-6 flex items-start gap-2 rounded border border-oxblood/40 bg-oxblood/10 p-3 text-sm text-oxblood" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {submitError}
            </div>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink/55">{canSubmit ? "Both exhibits are in order." : "Both signatures are required to begin."}</p>
            <button type="submit" disabled={!canSubmit} className="btn-brass">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
              {submitting ? "Sealing the evidence…" : "Begin Verification"}
            </button>
          </div>
        </form>
      )}

      <CaseHistory
        module={MODULES.verification}
        compact
        pageSize={5}
        selectedTaskId={taskId}
        refreshKey={`${taskId}:${isTerminalStatus(task?.status) ? task.status : ""}`}
      />
    </div>
  );
}
