import { BookOpen, FileSearch, FolderSearch, Fingerprint, LogOut, ScrollText, UserRound, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Emblem from "./Emblem";

const links = [
  { to: "/", label: "Investigation Room", icon: BookOpen, end: true },
  { to: "/detection", label: "Signature Detection", icon: FileSearch },
  { to: "/verification", label: "Signature Verification", icon: Fingerprint },
  { to: "/archives", label: "Case Archives", icon: FolderSearch },
  { to: "/reports", label: "Reports", icon: ScrollText },
  { to: "/profile", label: "Profile", icon: UserRound },
];

/** Journal-style navigation: leather surface, brass accents. Drawer on mobile. */
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const displayName = user?.fullName || user?.email || "Detective";

  return (
    <>
      {open && <div className="no-print fixed inset-0 z-30 bg-ink/50 md:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`leather no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-ivory transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        <div className="relative z-10 flex items-start justify-between px-6 pb-4 pt-7">
          <div className="flex flex-col items-start gap-3">
            <Emblem size={46} className="text-brass" />
            <div>
              <p className="font-display text-lg font-semibold leading-tight">Signature Verification System</p>
              <p className="label mt-1 !text-brass">Investigation bureau</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-brass hover:bg-ivory/10 md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 mx-6 h-px bg-gradient-to-r from-brass/70 to-transparent" />

        <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-ivory/12 text-ivory shadow-[inset_3px_0_0_var(--color-brass)]"
                    : "text-ivory/75 hover:translate-x-1 hover:bg-ivory/8 hover:text-ivory"
                }`
              }
            >
              <Icon className="h-4 w-4 text-brass transition-transform duration-200 group-hover:scale-110" />
              <span className="font-display text-[0.95rem] tracking-wide">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="relative z-10 mx-6 h-px bg-gradient-to-r from-brass/70 to-transparent" />
        <div className="relative z-10 px-4 pb-6 pt-4">
          <p className="truncate px-3 text-xs text-ivory/60" title={displayName}>Signed in as {displayName}</p>
          <button
            onClick={logout}
            className="group mt-2 flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-ivory/75 transition-all duration-200 hover:translate-x-1 hover:bg-ivory/8 hover:text-ivory"
          >
            <LogOut className="h-4 w-4 text-brass transition-transform duration-200 group-hover:scale-110" />
            <span className="font-display text-[0.95rem] tracking-wide">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
