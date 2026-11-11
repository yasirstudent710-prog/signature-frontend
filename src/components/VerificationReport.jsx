import { FolderOpen, Printer, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import Ornament from "./Ornament";
import { Row } from "./ReportParts";
import ScoreGauge from "./ScoreGauge";
import StatusBadge from "./StatusBadge";
import { TONE_CLASS, formatDateTime, formatPercent, verdictTone } from "../utils/caseLabels";

/**
 * Result of a SIGNATURE VERIFICATION task: the verification model's similarity score and
 * verdict for two signatures. No bounding boxes (that belongs to the detection module).
 *
 * The verdict is the backend's `verdict` text, shown verbatim. This component never computes
 * or overrides it, and never uses a detection confidence in its place.
 *
 * @param originalFile / suspectedFile  Files uploaded this session (local side-by-side preview only)
 */
function SignaturePreview({ file, caption }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const u = URL.createObjectURL(file);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setUrl(null);
    return undefined;
  }, [file]);

  return (
    <figure className="paper paper-stack flex flex-col overflow-hidden">
      <figcaption className="label border-b border-brass/40 px-4 py-2.5">{caption}</figcaption>
      <div className="flex min-h-32 items-center justify-center bg-white/60 p-3">
        {url
          ? <img src={url} alt={caption} className="max-h-48 max-w-full object-contain" />
          : <span className="px-4 text-center text-xs text-ink/60">Preview unavailable: the image is only held in the session that submitted it.</span>}
      </div>
    </figure>
  );
}

export default function VerificationReport({ task, filedAt, originalFile, suspectedFile, onReset }) {
  const [showFull, setShowFull] = useState(false);
  const r = task.result;

  if (!r) {
    return (
      <div className="paper p-5 text-sm" role="status">
        <p className="label">Verification report</p>
        <p className="mt-2">The task is marked completed, but the system returned no result data.</p>
        <p className="mono mt-2 break-all text-xs text-ink/60">Case {task.taskId}</p>
        <button onClick={onReset} className="btn-ghost mt-4"><FolderOpen className="h-4 w-4" /> Verify another signature</button>
      </div>
    );
  }

  const tone = verdictTone(r.verdict);

  return (
    <div className="space-y-6 page-enter">
      <section className="paper p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label">Authenticity report · signature verification</p>
            <h2 className="mt-1 text-2xl font-semibold text-burgundy sm:text-3xl">The Verification Report</h2>
          </div>
          <StatusBadge status={task.status} />
        </div>
        <Ornament className="my-5" />

        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <div className="mx-auto"><ScoreGauge value={r.similarityScore} /></div>
          <dl className="divide-y divide-brass/30">
            <Row label="Case ID"><span className="mono break-all text-xs sm:text-sm">{task.taskId}</span></Row>
            <Row label="Date and time filed"><span className="mono text-xs sm:text-sm">{filedAt ? formatDateTime(filedAt) : "Not provided"}</span></Row>
            <Row label="Investigation status"><StatusBadge status={task.status} /></Row>
            <Row label="Similarity score"><span className="mono">{formatPercent(r.similarityScore)}</span></Row>
            {r.threshold !== null && <Row label="Decision threshold"><span className="mono">{String(r.threshold)}</span></Row>}
            <Row label="Final verdict">
              {r.verdict
                ? <span className={`stamp anim-stamp ${TONE_CLASS[tone]}`}>{r.verdict}</span>
                : <span className="text-ink/60">Not reported</span>}
            </Row>
          </dl>
        </div>
      </section>

      <section>
        <p className="label">Forensic analysis</p>
        <h3 className="mt-1 text-xl font-semibold text-burgundy">Signatures Compared</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <SignaturePreview file={originalFile} caption="Original signature" />
          <SignaturePreview file={suspectedFile} caption="Suspected signature" />
        </div>
      </section>

      {r.metrics.length > 0 && (
        <section className="paper p-5 sm:p-7">
          <p className="label">Evaluation metrics</p>
          <dl className="mt-2 divide-y divide-brass/30">
            {r.metrics.map((m) => <Row key={m.name} label={m.name}><span className="mono">{String(m.value)}</span></Row>)}
          </dl>
        </section>
      )}

      <section className="paper p-5 sm:p-7">
        <p className="label">Concluding statement</p>
        <h3 className="mt-1 text-xl font-semibold text-burgundy">Investigation Findings</h3>
        <ul className="mt-3 space-y-2 text-[0.95rem] leading-relaxed">
          <li>
            {typeof r.similarityScore === "number"
              ? `The verification model rates the similarity of the two signatures at ${formatPercent(r.similarityScore)}.`
              : "No similarity score was reported."}
          </li>
          <li>
            {r.verdict ? `The model’s verdict is “${r.verdict}”.` : "No verdict was supplied by the verification model."}
          </li>
        </ul>
        <p className="mt-3 text-xs text-ink/55">
          The verdict is determined by the verification model and its configured threshold. This interface does not calculate or alter it.
        </p>
        <div className="no-print mt-5 flex flex-wrap gap-3">
          <button onClick={() => setShowFull((v) => !v)} className="btn-brass" aria-expanded={showFull}>
            <ScrollText className="h-4 w-4" /> {showFull ? "Hide Full Case Report" : "View Full Case Report"}
          </button>
          <button onClick={onReset} className="btn-ghost"><FolderOpen className="h-4 w-4" /> Verify Another Signature</button>
        </div>
      </section>

      {showFull && (
        <section className="paper anim-settle p-5 sm:p-7" aria-label="Full case report">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label">Case file · complete record</p>
              <h3 className="mt-1 text-xl font-semibold text-burgundy">Full Case Report</h3>
            </div>
            <button onClick={() => window.print()} className="btn-ghost no-print"><Printer className="h-4 w-4" /> Print / save as PDF</button>
          </div>
          <Ornament className="my-4" />
          <dl className="divide-y divide-brass/30">
            <Row label="Case ID"><span className="mono break-all">{task.taskId}</span></Row>
            <Row label="Filed"><span className="mono">{filedAt ? formatDateTime(filedAt) : "Not provided"}</span></Row>
            <Row label="Status (as received)"><span className="mono">{task.status}</span></Row>
            <Row label="Similarity score (raw)"><span className="mono">{r.similarityScore ?? "null"}</span></Row>
            <Row label="Verdict (raw)"><span className="mono">{r.verdict ?? "null"}</span></Row>
            <Row label="Threshold (raw)"><span className="mono">{r.threshold ?? "not reported"}</span></Row>
          </dl>
        </section>
      )}
    </div>
  );
}
