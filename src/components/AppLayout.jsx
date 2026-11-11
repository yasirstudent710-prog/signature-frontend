import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/** Shell for all protected pages: journal sidebar (drawer on mobile) + content area. */
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="md:pl-64">
        <Navbar onMenuClick={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
          {/* keyed by route so each page fades in on navigation */}
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
