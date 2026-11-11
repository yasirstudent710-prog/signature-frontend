import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";
import { AUTH_EXPIRED_EVENT, extractErrorMessage, getToken } from "../api/axios";

/**
 * Holds the current user and session status.
 * status: "loading" (validating stored token) | "authenticated" | "unauthenticated"
 *
 * Token storage/headers live in src/api/axios.js, so a switch to cookie auth
 * only touches that file and (if the response shape differs) authApi.js.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? "loading" : "unauthenticated");
  const [sessionError, setSessionError] = useState(null);

  // Validate any stored session on startup via GET /auth/me.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    authApi
      .getCurrentUser()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 already cleared the token in the axios interceptor. For network errors
        // we keep the token, but send the user to the login screen with an explanation.
        if (err?.response?.status !== 401) setSessionError(extractErrorMessage(err));
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from the API (expired token) drops the session.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus("unauthenticated");
      setSessionError("Your session has expired. Please sign in again.");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    let u = await authApi.login(email, password);
    if (!u) u = await authApi.getCurrentUser(); // login response had no `user`
    setUser(u);
    setSessionError(null);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* local state is cleared regardless */
    }
    setUser(null);
    setSessionError(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, status, sessionError, login, logout, isAuthenticated: status === "authenticated" }),
    [user, status, sessionError, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
