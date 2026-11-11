/** Small ornamental separator: rule - diamond - rule. */
export default function Ornament({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 text-brass ${className}`} role="presentation">
      <span className="h-px flex-1 bg-current opacity-60" />
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M7 0l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-current opacity-60" />
    </div>
  );
}
