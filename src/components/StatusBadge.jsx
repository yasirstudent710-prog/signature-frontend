import { AlertCircle, CheckCircle2, Hourglass, Search } from "lucide-react";
import { statusLabel } from "../utils/caseLabels";

const STYLES = {
  queued: { cls: "border-brass-dark/50 bg-parchment text-brass-dark", Icon: Hourglass },
  processing: { cls: "border-burgundy/40 bg-burgundy/10 text-burgundy", Icon: Search, pulse: true },
  completed: { cls: "border-forest/50 bg-forest/10 text-forest", Icon: CheckCircle2 },
  failed: { cls: "border-oxblood/50 bg-oxblood/10 text-oxblood", Icon: AlertCircle },
};

/** Themed pill for a backend task status. Unknown values are shown as received. */
export default function StatusBadge({ status }) {
  const s = STYLES[status] ?? { cls: "border-ink/20 bg-parchment text-ink/70", Icon: Hourglass };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <s.Icon className={`h-3.5 w-3.5 ${s.pulse ? "anim-pulse" : ""}`} />
      {statusLabel(status)}
    </span>
  );
}
