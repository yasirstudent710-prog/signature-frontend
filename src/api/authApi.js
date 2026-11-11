/**
 * Auth endpoints.
 *
 * ASSUMED CONTRACT (confirm with backend developer):
 *  POST /api/v1/auth/login   body {email, password}
 *       -> {access_token, token_type, user:{id,email,full_name}}
 *  GET  /api/v1/auth/me      (Bearer token) -> user object {id,email,full_name}
 *  POST /api/v1/auth/logout  (Bearer token) -> any 2xx
 *
 * If the backend uses OAuth2 form login instead (application/x-www-form-urlencoded
 * with `username`/`password`), change `login` below only.
 */
import api, { setToken, clearToken } from "./axios";

const mapUser = (u) => ({
  id: u?.id,
  email: u?.email,
  fullName: u?.full_name ?? u?.fullName ?? u?.name ?? "",
});

export const login = async (email, password) => {
  const { data } = await api.post("/api/v1/auth/login", { email, password });
  if (data.access_token) setToken(data.access_token);
  return data.user ? mapUser(data.user) : null; // null => caller fetches /me
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/api/v1/auth/me");
  return mapUser(data.user ?? data);
};

export const logout = async () => {
  try {
    await api.post("/api/v1/auth/logout");
  } finally {
    clearToken(); // always clear local state, even if the server call fails
  }
};
