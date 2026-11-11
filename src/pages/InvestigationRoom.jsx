import { ArrowRight, FileSearch, Fingerprint } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * The Investigation Room: landing page with the two independent modules.
 * Pure navigation. It makes no API calls; each module loads its own data in its workspace.
 */
const CARDS = [
  {
    to: "/detection",
    icon: FileSearch,
    label: "Module I",
    title: "Signature Detection",
    text: "Submit one document or image. The detection model locates every signature and reports where it sits.",
    io: ["In: one document or image", "Out: signature locations"],
    cta: "Open Detection",
  },
  {
    to: "/verification",
    icon: Fingerprint,
    label: "Module II",
    title: "Signature Verification",
    text: "Submit an original signature and a suspected one. The verification model scores their similarity and gives its verdict.",
    io: ["In: two signature images", "Out: similarity score and verdict"],
    cta: "Open Verification",
  },
];

export default function InvestigationRoom() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">The Investigation Room</p>
          <h1 className="mt-1 text-4xl font-semibold text-burgundy sm:text-5xl">Good day, Detective.</h1>
          <p className="mt-2 font-display text-lg italic text-ink/70">Ready to uncover the truth behind another signature?</p>
        </div>
        <div className="text-right">
          <p className="mono text-xs text-ink/70">{today}</p>
          {user?.fullName && <p className="mt-1 text-xs text-ink/60">Signed in as {user.fullName}</p>}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {CARDS.map(({ to, icon: Icon, label, title, text, io, cta }) => (
          <Link key={to} to={to} className="paper paper-stack group flex flex-col p-6 transition-transform duration-200 hover:-translate-y-1 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="label">{label}</span>
              <Icon className="h-6 w-6 text-brass-dark transition-transform group-hover:scale-110" strokeWidth={1.5} />
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-burgundy">{title}</h2>
            <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-ink/80">{text}</p>
            <ul className="mono mt-4 space-y-1 border-t border-dashed border-brass/50 pt-3 text-xs text-ink/65">
              {io.map((l) => <li key={l}>{l}</li>)}
            </ul>
            <span className="mt-4 inline-flex items-center gap-2 font-display font-semibold text-burgundy">
              {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
