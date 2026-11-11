import { LogOut } from "lucide-react";
import Emblem from "../components/Emblem";
import Ornament from "../components/Ornament";
import { useAuth } from "../context/AuthContext";

/** Investigator profile. Shows only what /auth/me (or the login response) returned. */
export default function Profile() {
  const { user, logout } = useAuth();
  const fields = [
    ["Name", user?.fullName],
    ["Email", user?.email],
    ["Investigator ID", user?.id],
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="label">Profile</p>
        <h1 className="mt-1 text-4xl font-semibold text-burgundy">Investigator&rsquo;s Credentials</h1>
      </header>

      <section className="paper paper-stack max-w-xl p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Emblem size={56} className="text-brass-dark" />
          <div className="min-w-0">
            <p className="label">Registered investigator</p>
            <p className="truncate font-display text-2xl font-semibold text-burgundy">{user?.fullName || user?.email || "Detective"}</p>
          </div>
        </div>
        <Ornament className="my-5" />
        <dl className="divide-y divide-brass/30">
          {fields.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between">
              <dt className="text-sm text-ink/70">{k}</dt>
              <dd className="mono break-all text-sm">{v || "—"}</dd>
            </div>
          ))}
        </dl>
        <button onClick={logout} className="btn-ghost mt-5"><LogOut className="h-4 w-4" /> Logout</button>
      </section>
    </div>
  );
}
