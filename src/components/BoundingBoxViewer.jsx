import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Bounding-box visualisation for SIGNATURE DETECTION results.
 * Draws the backend's boxes over the image the user uploaded this session (local file; no
 * request is made). If the backend also supplied `annotated_image_url`, the user can switch
 * to that image. Receives everything via props.
 *
 * Boxes are pixels in the uploaded image's coordinate space (ASSUMPTION, see detectionApi.js).
 */
const isNum = (n) => typeof n === "number" && Number.isFinite(n);
const validBox = (b) => b && [b.x, b.y, b.width, b.height].every(isNum) && b.width > 0 && b.height > 0;
const safeUrl = (u) => typeof u === "string" && /^(https?:\/\/|\/)/.test(u);

export default function BoundingBoxViewer({ file, detections, annotatedImageUrl, activeIndex, onActiveChange }) {
  const [url, setUrl] = useState(null);
  const [size, setSize] = useState(null); // natural pixel size of the uploaded image
  const [view, setView] = useState("local"); // local | annotated
  const isImage = Boolean(file) && file.type.startsWith("image/");
  const hasAnnotated = safeUrl(annotatedImageUrl);

  useEffect(() => {
    if (!isImage) {
      setUrl(null);
      setSize(null);
      return undefined;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);

  const mode = isImage && view === "local" ? "local" : hasAnnotated ? "annotated" : isImage ? "local" : "none";

  if (mode === "none") {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded border border-dashed border-brass/60 bg-parchment/40 p-6 text-center text-sm text-ink/65">
        <ImageOff className="h-6 w-6 text-brass" />
        {file ? "Box preview is available for image documents only (not PDFs)." : "The original document is only held in the session that submitted it, so the boxes cannot be drawn here."}
        <span className="text-xs">The detected regions are listed below.</span>
      </div>
    );
  }

  return (
    <div>
      {isImage && hasAnnotated && (
        <div className="mb-2 flex gap-2 text-xs" role="group" aria-label="Image view">
          {[["local", "Original with boxes"], ["annotated", "Detector's annotated image"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setView(k)} aria-pressed={mode === k}
              className={`rounded border px-2.5 py-1 ${mode === k ? "border-burgundy bg-burgundy text-ivory" : "border-brass/60 text-burgundy hover:bg-brass/15"}`}>{l}</button>
          ))}
        </div>
      )}
      <div className="flex justify-center overflow-auto rounded border border-brass/50 bg-white/60 p-2">
        {mode === "annotated" ? (
          <img src={annotatedImageUrl} alt="Annotated document returned by the detector" className="block max-h-[30rem] max-w-full" />
        ) : (
          <div className="relative inline-block max-w-full">
            <img
              src={url ?? undefined}
              alt="Uploaded document"
              onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="block max-h-[30rem] max-w-full"
            />
            {size && (
              <svg viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                {detections.map((d, i) => validBox(d.boundingBox) && (
                  <g key={d.id ?? i} onMouseEnter={() => onActiveChange(i)} onMouseLeave={() => onActiveChange(null)}>
                    <rect
                      x={d.boundingBox.x} y={d.boundingBox.y} width={d.boundingBox.width} height={d.boundingBox.height}
                      fill={activeIndex === i ? "rgb(84 43 50 / 0.2)" : "rgb(176 141 87 / 0.12)"}
                      stroke={activeIndex === i ? "#542b32" : "#7a5d2f"}
                      strokeWidth={activeIndex === i ? 4 : 2.5} vectorEffect="non-scaling-stroke"
                    />
                    <text x={d.boundingBox.x + 4} y={d.boundingBox.y - 6} fontSize={Math.max(14, size.h / 30)} fontFamily="IBM Plex Mono, monospace" fill="#542b32" fontWeight="600">{i + 1}</text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
