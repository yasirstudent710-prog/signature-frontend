import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { extractErrorMessage } from "../api/axios";
import Emblem from "../components/Emblem";
import OfficeIllustration from "../components/OfficeIllustration";
import Ornament from "../components/Ornament";
import { useAuth } from "../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Authentication logic is unchanged from the pre-redesign version; only the presentation differs.
export default function Login() {
  const { login, isAuthenticated, status, sessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (status !== "loading" && isAuthenticated) return <Navigate to={redirectTo} replace />;

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Please provide your email address.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "That does not look like a valid email address.";
    if (!password) e.password = "Please enter your password.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setApiError(extractErrorMessage(err, "Unable to sign in."));
      setLoading(false);
    }
  };

  const shownError = apiError || sessionError;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Left: the detective's office (desktop) */}
      <section className="relative hidden overflow-hidden bg-mahogany lg:block">
        <OfficeIllustration className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-mahogany via-mahogany/70 to-transparent" />
        <div className="relative z-10 flex h-full max-w-xl flex-col px-12 pb-12 pt-14 xl:px-16">
          <div className="flex items-center gap-3 text-brass">
            <Emblem size={44} />
            <span className="label !text-brass">Private signature examination office</span>
          </div>
          <h1 className="mt-10 text-5xl font-semibold leading-[1.1] text-ivory xl:text-6xl">The Art of Verification</h1>
          <Ornament className="my-6 max-w-xs" />
          <p className="max-w-md font-display text-xl italic leading-relaxed text-parchment">
            Every detail tells a story. Every signature leaves evidence.
          </p>
        </div>
      </section>

      {/* Right: case registration document */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* compact header on small screens, where the illustration is hidden */}
          <div className="mb-6 text-center lg:hidden">
            <Emblem size={52} className="mx-auto text-burgundy" />
            <h1 className="mt-3 text-3xl font-semibold text-burgundy">The Art of Verification</h1>
            <p className="mt-1 font-display italic text-ink/70">Every detail tells a story. Every signature leaves evidence.</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="paper paper-stack page-enter p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label">Investigator access</p>
                <h2 className="mt-1 text-2xl font-semibold text-burgundy">Case Registration</h2>
                <p className="mt-1 text-sm text-ink/70">Sign in to enter the investigation room.</p>
              </div>
              <Emblem size={44} className="hidden shrink-0 text-brass-dark sm:block" />
            </div>
            <Ornament className="my-5" />

            {shownError && (
              <div className="mb-4 flex items-start gap-2 rounded border border-oxblood/40 bg-oxblood/10 p-3 text-sm text-oxblood" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{shownError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label mb-1.5 block">Email address</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="detective@example.com" className="input-field" aria-invalid={Boolean(errors.email)} />
                {errors.email && <p className="mt-1 text-sm text-oxblood">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="label mb-1.5 block">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-11" aria-invalid={Boolean(errors.password)} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute inset-y-0 right-0 flex items-center px-3 text-brass-dark transition-colors hover:text-burgundy" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-oxblood">{errors.password}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-brass mt-6 w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {loading ? "Opening the door…" : "Enter the Investigation Room"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
