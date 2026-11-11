/** Application emblem: a magnifying glass over a signature, ringed like a seal. Uses currentColor. */
export default function Emblem({ size = 40, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.5 2.5" />
      <circle cx="28" cy="28" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path d="M37 37 L48 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M21 30c1.5-6 3.5-7 4.5-2s2.5 3.5 4-1.5 3-3 4.5 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
