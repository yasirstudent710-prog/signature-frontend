/** Tiny presentational helper shared by both report components (label / value row). */
export const Row = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
    <dt className="text-sm text-ink/70">{label}</dt>
    <dd className="text-sm font-medium sm:text-right">{children}</dd>
  </div>
);
