import { MODULE_LIST } from "../modules";

/** Tab switcher between the two modules. Controlled: the parent decides what to load. */
export default function ModuleTabs({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Module" className="mb-6 inline-flex rounded border border-brass/60 bg-ivory/70 p-1">
      {MODULE_LIST.map((m) => (
        <button
          key={m.key}
          role="tab"
          aria-selected={value === m.key}
          onClick={() => onChange(m.key)}
          className={`rounded px-4 py-1.5 font-display text-sm transition-colors ${
            value === m.key ? "bg-burgundy text-ivory shadow-sm" : "text-burgundy hover:bg-brass/15"
          }`}
        >
          {m.title}
        </button>
      ))}
    </div>
  );
}
