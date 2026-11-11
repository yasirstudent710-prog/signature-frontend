import { AlertCircle, Loader2, ScanSearch } from "lucide-react";
import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { extractErrorMessage } from "../api/axios";
import { submitDetection } from "../api/detectionApi";
import { isTerminalStatus } from "../api/taskStatus";
import DetectionReport from "../components/DetectionReport";
import FileUploader from "../components/FileUploader";
import InvestigationAnimation from "../components/InvestigationAnimation";
import Ornament from "../components/Ornament";
import useDetectionPolling from "../hooks/useDetectionPolling";
import { MODULES } from "../modules";
import { DETECTION_STAGES } from "../utils/stages";
import CaseHistory from "./CaseHistory";

/**
 * SIGNATURE DETECTION workspace. One document/image in; signature locations out.
 * Uses ONLY detectionApi (via useDetectionPolling). It never calls verification endpoints.
 *
 * Backend state  : `task` (from the polling hook), `taskId` (kept in the URL as ?task=).
 * Frontend state : selected file, submit progress, `submittedCase` (for local previews).
 */
export default function DetectionWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const taskId = searchParams.get("task");

  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedCase, setSubmittedCase] = useState(null); // {id, at}: this session's submission

  const { task, error: pollError, retry: retryPolling } = useDetectionPolling(taskId);

  const isSubmittedHere = submittedCase?.id === taskId;
  const filedAt = task?.createdAt ?? location.state?.createdAt ?? (isSubmittedHere ? submittedCase.at : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitDetection(file); // returns a task id immediately
      if (!res.taskId) throw new Error("The server did not return a task ID.");
      setSubmittedCase({ id: res.taskId, at: new Date().toISOString() });
      setSearchParams({ task: res.taskId });
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "Could not submit the document for detection."));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSubmitError(null);
    setSearchParams({});
  };
  const retryFailed = () => {
    setSubmitError(null);
    setSearchParams({}); // back to the form with the file kept
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="label">Signature detection</p>
        <h1 className="mt-1 text-4xl font-semibold text-burgundy">Locate Signatures</h1>
        <p className="mt-2 font-display text-lg italic text-ink/70">Find where signatures appear in a document or image.</p>
      </header>

      {taskId ? (
        <div className="space-y-4">
          {task?.status === "completed" ? (
            <DetectionReport task={task} filedAt={filedAt} documentFile={isSubmittedHere ? file : null} onReset={reset} />
          ) : (
            <>
              <InvestigationAnimation stages={DETECTION_STAGES} taskId={taskId} task={task} pollError={pollError} onRetry={retryFailed} onPollRetry={retryPolling} />
              {!isTerminalStatus(task?.status) && <button onClick={reset} className="btn-ghost">Close this view and open another case</button>}
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="paper paper-stack p-5 sm:p-8">
          <p className="label">Case intake</p>
          <h2 className="mt-1 text-2xl font-semibold text-burgundy sm:text-3xl">Submit a Document for Detection</h2>
          <p className="mt-1.5 text-ink/75">Detection only locates signatures. It does not compare them or judge authenticity.</p>
          <Ornament className="my-6" />
          <div className="max-w-xl">
            <FileUploader kind="document" exhibit="Exhibit A" label="Document Evidence" description="Upload the document or image to search for signatures." file={file} onChange={setFile} disabled={submitting} />
          </div>
          {submitError && (
            <div className="mt-6 flex items-start gap-2 rounded border border-oxblood/40 bg-oxblood/10 p-3 text-sm text-oxblood" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {submitError}
            </div>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink/55">{file ? "The exhibit is in order." : "A document is required to begin."}</p>
            <button type="submit" disabled={!file || submitting} className="btn-brass">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {submitting ? "Sealing the evidence…" : "Begin Detection"}
            </button>
          </div>
        </form>
      )}

      <CaseHistory
        module={MODULES.detection}
        compact
        pageSize={5}
        selectedTaskId={taskId}
        refreshKey={`${taskId}:${isTerminalStatus(task?.status) ? task.status : ""}`}
      />
    </div>
  );
}
