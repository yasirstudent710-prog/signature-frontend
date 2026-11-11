import { Menu } from "lucide-react";
import Emblem from "./Emblem";

/** Top bar for small screens only; holds the menu button that opens the Sidebar drawer. */
export default function Navbar({ onMenuClick }) {
  return (
    <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-brass/60 bg-mahogany px-4 text-ivory md:hidden">
      <button onClick={onMenuClick} className="rounded p-1.5 text-brass hover:bg-ivory/10" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <Emblem size={24} className="text-brass" />
      <span className="font-display text-sm font-semibold">Signature Verification System</span>
    </header>
  );
}
