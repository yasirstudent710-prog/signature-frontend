import { FolderOpen, Printer, ScrollText } from "lucide-react";
import { useState } from "react";
import BoundingBoxViewer from "./BoundingBoxViewer";
import EvidenceCard from "./EvidenceCard";
import Ornament from "./Ornament";
import { Row } from "./ReportParts";
import StatusBadge from "./StatusBadge";
import { confidenceToPercent, formatDateTime, formatPercent } from "../utils/caseLabels";

/**
 * Result of a SIGNATURE DETECTION task: where signatures were found.
 * Shows only detection data. No similarity, no verdict (that belongs to the verification
 * module). Pure presentation of the mapped backend response (see detectionApi.js).
 *
 * @param filedAt       date filed, if known to the parent
 * @param documentFile  File uploaded this session (local preview only)
 */
export default function DetectionReport({ task, filedAt, documentFile, onReset }) {
  const [showFull, setShowFull] = useState(false);
  const [active, setActive] = useState(null);
  const r = task.result;

  if (!r) {
    return (
      <div className="paper p-5 text-sm" role="status">
        <p className="label">Detection report</p>
        <p className="mt-2">The task is marked completed, but the system returned no result data.</p>
        <p className="mono mt-2 break-all text-xs text-ink/60">Case {task.taskId}</p>
        <button onClick={onReset} className="btn-ghost mt-4"><FolderOpen className="h-4 w-4" /> Examine another document</button>
      </div>
    );
  }

  const dets = r.detections;
  const count = r.signatureCount;
  const confidences = dets.map((d) => confidenceToPercent(d.confidence)).filter((c) => c !== null);

  return (
    <div className="space-y-6 page-enter">
      <section className="paper p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label">Forensic analysis · signature detection</p>
            <h2 className="mt-1 text-2xl font-semibold text-burgundy sm:text-3xl">The Detection Report</h2>
          </div>
          <StatusBadge status={task.status} />
        </div>
        <Ornament className="my-5" />

        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <div className="mx-auto flex h-44 w-44 flex-col items-center justify-center rounded-full border-4 border-double border-brass bg-ivory text-center">
            <span className="font-display text-6xl font-semibold text-burgundy">{count ?? "—"}</span>
            <span className="label mt-1">{count === 1 ? "Signature located" : "Signatures located"}</span>
          </div>
          <dl className="divide-y divide-brass/30">
            <Row label="Case ID"><span className="mono break-all text-xs sm:text-sm">{task.taskId}</span></Row>
            <Row label="Date and time filed"><span className="mono text-xs sm:text-sm">{filedAt ? formatDateTime(filedAt) : "Not provided"}</span></Row>
            <Row label="Investigation status"><StatusBadge status={task.status} /></Row>
            <Row label="Signatures detected">{count === null ? "Not reported" : count}</Row>
            <Row label="Detection confidence">
              <span className="mono">{confidences.length ? confidences.map((c) => formatPercent(c)).join(" · ") : "Not reported"}</span>
            </Row>
          </dl>
        </div>
      </section>

      <section>
        <p className="label">Forensic analysis</p>
        <h3 className="mt-1 text-xl font-semibold text-burgundy">Evidence Examination</h3>
        {count === 0 || dets.length === 0 ? (
          <p className="paper mt-3 p-5 text-sm text-ink/75">
            {count === 0 ? "The detector reports no signatures in this document." : "No signature regions were listed by the detector."}
          </p>
        ) : (
          <>
            <div className="mt-4">
              <BoundingBoxViewer file={documentFile} detections={dets} annotatedImageUrl={r.annotatedImageUrl} activeIndex={active} onActiveChange={setActive} />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dets.map((s, i) => (
                <EvidenceCard key={s.id ?? i} signature={s} index={i} documentFile={documentFile} active={active === i} onActiveChange={setActive} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="paper p-5 sm:p-7">
        <p className="label">Concluding statement</p>
        <h3 className="mt-1 text-xl font-semibold text-burgundy">Investigation Findings</h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed">
          {count === null
            ? "The system did not report how many signatures were found."
            : count === 0
              ? "The examination found no signatures in the submitted document."
              : `The examination located ${count} signature${count === 1 ? "" : "s"} in the submitted document.`}
        </p>
        <p className="mt-3 text-xs text-ink/55">
          Detection only locates signatures. It does not compare them or judge whether any is genuine; use Signature Verification for that.
        </p>
        <div className="no-print mt-5 flex flex-wrap gap-3">
          <button onClick={() => setShowFull((v) => !v)} className="btn-brass" aria-expanded={showFull}>
            <ScrollText className="h-4 w-4" /> {showFull ? "Hide Full Case Report" : "View Full Case Report"}
          </button>
          <button onClick={onReset} className="btn-ghost"><FolderOpen className="h-4 w-4" /> Examine Another Document</button>
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
            <Row label="Signature count (raw)"><span className="mono">{count ?? "null"}</span></Row>
            <Row label="Image size reported"><span className="mono">{r.imageWidth && r.imageHeight ? `${r.imageWidth} × ${r.imageHeight}` : "not reported"}</span></Row>
          </dl>
          {dets.map((s, i) => (
            <div key={s.id ?? i} className="mt-4 rounded border border-brass/40 bg-parchment/50 p-3">
              <p className="label">Exhibit {i + 1}</p>
              <pre className="mono mt-1.5 overflow-x-auto text-xs leading-relaxed">{JSON.stringify(s, null, 2)}</pre>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
