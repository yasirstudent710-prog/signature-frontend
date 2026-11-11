import { ChevronDown, FolderOpen } from "lucide-react";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { TONE_CLASS, formatDateTime } from "../utils/caseLabels";

/**
 * One archived case, styled as a folder. Pure presentation, module-agnostic.
 * The parent decides which module-specific facts to show:
 *   facts = [{label, value, tone?}]   (e.g. "Signatures found: 2" or "Similarity: 92.5%")
 */
export default function CaseFile({ item, facts, selected, onOpen }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className={`paper paper-stack relative transition-transform duration-200 hover:-translate-y-0.5 ${selected ? "ring-2 ring-brass-dark" : ""}`}>
      <span className="label absolute -top-3 left-4 rounded-t border border-b-0 border-brass/60 bg-parchment-dark px-2.5 py-0.5 !text-[10px]">
        Case file
      </span>

      <div className="flex items-stretch">
        <button
          onClick={() => onOpen(item)}
          className="min-w-0 flex-1 rounded-l-md px-4 pb-3.5 pt-4 text-left transition-colors hover:bg-brass/10 sm:px-5"
          aria-label={`Open case ${item.taskId}`}
        >
          <p className="mono truncate text-sm font-medium text-burgundy">{item.taskId}</p>
          <p className="mono mt-0.5 text-xs text-ink/60">{formatDateTime(item.createdAt)}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <StatusBadge status={item.status} />
            {facts.map((f) => (
              <span key={f.label} className="text-xs text-ink/70">
                {f.label} <span className={`mono font-medium ${TONE_CLASS[f.tone ?? "neutral"]}`}>{f.value}</span>
              </span>
            ))}
          </div>
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide case details" : "Show case details"}
          className="flex w-11 shrink-0 items-start justify-center rounded-r-md border-l border-brass/30 pt-4 text-brass-dark transition-colors hover:bg-brass/10"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="anim-settle border-t border-dashed border-brass/50 px-4 py-3 sm:px-5">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="label">Case ID</dt><dd className="mono break-all text-xs">{item.taskId}</dd></div>
            <div><dt className="label">Submitted</dt><dd className="mono text-xs">{formatDateTime(item.createdAt)}</dd></div>
            <div><dt className="label">Status (as received)</dt><dd className="mono text-xs">{item.status}</dd></div>
            {facts.map((f) => (
              <div key={f.label}><dt className="label">{f.label}</dt><dd className="mono text-xs">{f.value}</dd></div>
            ))}
          </dl>
          <button onClick={() => onOpen(item)} className="btn-ghost mt-3"><FolderOpen className="h-4 w-4" /> Reopen case</button>
        </div>
      )}
    </li>
  );
}
