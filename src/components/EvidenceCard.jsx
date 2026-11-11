import { FileSearch, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { confidenceToPercent, formatPercent } from "../utils/caseLabels";

/**
 * One detected signature as an evidence exhibit.
 * Receives data via props only (no API calls).
 *
 * The signature preview is cropped IN THE BROWSER from the document the user just uploaded,
 * using the backend's bounding_box (ASSUMPTION: pixels, origin top-left, in the coordinate
 * space of the uploaded image). When the original file is not available (case reopened from
 * the archive, PDF documents, no bounding box) a placeholder explains why; nothing is faked.
 */
const isNum = (n) => typeof n === "number" && Number.isFinite(n);

export default function EvidenceCard({ signature, index, documentFile, active = false, onActiveChange = () => {} }) {
  const box = signature.boundingBox;
  const hasBox = Boolean(box) && [box.x, box.y, box.width, box.height].every(isNum) && box.width > 0 && box.height > 0;
  const isImage = Boolean(documentFile) && documentFile.type.startsWith("image/");

  const canvasRef = useRef(null);
  const [preview, setPreview] = useState("none"); // none | loading | ready | outside | error
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });

  useEffect(() => {
    if (!isImage || !hasBox) {
      setPreview("none");
      return undefined;
    }
    let cancelled = false;
    setPreview("loading");
    const url = URL.createObjectURL(documentFile);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const sx = Math.max(0, box.x);
      const sy = Math.max(0, box.y);
      const sw = Math.min(img.naturalWidth, box.x + box.width) - sx;
      const sh = Math.min(img.naturalHeight, box.y + box.height) - sy;
      if (sw <= 0 || sh <= 0) return setPreview("outside");
      const canvas = canvasRef.current;
      canvas.width = sw;
      canvas.height = sh;
      canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      setPreview("ready");
    };
    img.onerror = () => !cancelled && setPreview("error");
    img.src = url;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [documentFile, isImage, hasBox, box?.x, box?.y, box?.width, box?.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const pointerOrigin = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const placeholder =
    !documentFile ? "Preview unavailable: the original document is only held in the session that submitted it."
    : !isImage ? "Preview unavailable for PDF documents."
    : !hasBox ? "No bounding box was supplied for this signature."
    : preview === "outside" ? "The bounding box lies outside the document image."
    : preview === "error" ? "The document image could not be read."
    : null;

  const confidence = confidenceToPercent(signature.confidence);

  return (
    <article
      onMouseEnter={() => onActiveChange(index)}
      onMouseLeave={() => onActiveChange(null)}
      className={`paper paper-stack anim-settle flex flex-col overflow-hidden ${active ? "ring-2 ring-burgundy" : ""}`}
    >
      <header className="flex items-center justify-between border-b border-brass/40 px-4 py-2.5">
        <p className="label">Exhibit {index + 1}{signature.page != null ? ` · page ${signature.page}` : ""}</p>
        <p className="mono text-xs text-ink/60">ID {signature.id ?? "—"}</p>
      </header>

      <div className="p-4">
        {/* Preview with click/hover-to-inspect zoom */}
        <button
          type="button"
          onClick={(e) => {
            const origin = pointerOrigin(e); // read currentTarget now: it is null inside a state updater
            setZoom((z) => ({ on: !z.on, ...origin }));
          }}
          onPointerMove={(e) => {
            if (!zoom.on) return;
            const origin = pointerOrigin(e);
            setZoom((z) => ({ ...z, ...origin }));
          }}
          onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
          disabled={preview !== "ready"}
          aria-label={zoom.on ? "Zoom out" : "Inspect signature closely"}
          className={`group relative flex min-h-28 w-full items-center justify-center overflow-hidden rounded border border-brass/50 bg-white/60 ${
            preview === "ready" ? (zoom.on ? "cursor-zoom-out" : "cursor-zoom-in") : "cursor-default"
          }`}
        >
          <canvas
            ref={canvasRef}
            className={`max-h-48 w-full object-contain transition-transform duration-200 ${preview === "ready" ? "" : "hidden"}`}
            style={{ transform: zoom.on ? "scale(2.6)" : "none", transformOrigin: `${zoom.x}% ${zoom.y}%` }}
          />
          {preview === "ready" && !zoom.on && (
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-mahogany/80 px-1.5 py-0.5 text-[10px] text-ivory opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3 w-3" /> Inspect
            </span>
          )}
          {preview !== "ready" && (
            <span className="flex flex-col items-center gap-2 px-4 py-6 text-center text-xs text-ink/60">
              <FileSearch className="h-6 w-6 text-brass" />
              {preview === "loading" ? "Preparing the exhibit…" : placeholder}
            </span>
          )}
        </button>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <div className="flex items-baseline justify-between">
              <dt className="text-ink/70">Detection confidence</dt>
              <dd className="mono font-medium">{confidence === null ? "Not reported" : formatPercent(confidence)}</dd>
            </div>
            {confidence !== null && (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-parchment-dark">
                <div className="h-full rounded-full bg-brass-dark" style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }} />
              </div>
            )}
          </div>
          <div>
            <dt className="text-ink/70">Bounding box (px)</dt>
            <dd className="mt-1.5 grid grid-cols-4 gap-1.5 text-center">
              {[["x", box?.x], ["y", box?.y], ["w", box?.width], ["h", box?.height]].map(([k, v]) => (
                <span key={k} className="rounded border border-brass/40 bg-parchment/60 px-1 py-1">
                  <span className="label block !text-[9px]">{k}</span>
                  <span className="mono text-xs">{isNum(v) ? v : "—"}</span>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
