import { useEffect, useState } from "react";

/**
 * Circular evidence gauge for the backend's similarity score (ASSUMPTION: 0-100).
 * The ring is deliberately a neutral brass: colour never implies pass/fail, because the
 * backend (not the UI) owns any threshold. A missing score renders an empty ring and "—".
 */
export default function ScoreGauge({ value, size = 200 }) {
  const valid = typeof value === "number" && Number.isFinite(value);
  const pct = valid ? Math.min(100, Math.max(0, value)) : 0;
  const [shown, setShown] = useState(0); // lets the ring sweep to the real value once

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const r = 78;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={valid ? `Similarity score ${value.toFixed(1)} percent` : "Similarity score not reported"}>
        {/* instrument ticks */}
        {Array.from({ length: 50 }).map((_, i) => (
          <line
            key={i}
            x1="100" y1="6" x2="100" y2={i % 5 === 0 ? 15 : 11}
            stroke="var(--color-brass)"
            strokeWidth={i % 5 === 0 ? 1.6 : 0.9}
            transform={`rotate(${(i * 360) / 50} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-parchment-dark)" strokeWidth="9" />
        <circle
          cx="100" cy="100" r={r} fill="none"
          stroke="var(--color-brass-dark)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-4xl font-semibold text-burgundy">{valid ? `${value.toFixed(1)}%` : "—"}</span>
        <span className="label mt-1">Similarity score</span>
      </div>
    </div>
  );
}
