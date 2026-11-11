/**
 * Centralised Axios instance. EVERY HTTP call in the app goes through `api`.
 *
 * -- Where to change things if the backend contract changes --
 *  - Base URL ........ VITE_API_BASE_URL in .env
 *  - Token storage ... TOKEN_KEY + get/set/clearToken below (e.g. switch to cookies)
 *  - Auth header ..... request interceptor below (ASSUMPTION: "Authorization: Bearer <jwt>")
 *  - Cookie sessions . set `withCredentials: true` below, delete the interceptor,
 *                      and make setToken/getToken no-ops. FastAPI must then enable
 *                      CORS with allow_credentials=True and an explicit origin.
 *  - Error shape ..... `extractErrorMessage` (ASSUMPTION: FastAPI {"detail": ...})
 */
import axios from "axios";

const TOKEN_KEY = "sv_access_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
};
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // default; uploads override this (see verificationApi)
  // withCredentials: true, // <- enable only for cookie-based auth
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Lets the app react to an expired session without importing React here.
export const AUTH_EXPIRED_EVENT = "sv:auth-expired";

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLogin) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

/**
 * Turns any Axios error into a human-readable string.
 * FastAPI errors look like {"detail": "msg"} or {"detail": [{"msg": "...", "loc": [...]}]}.
 * Also handles {"message": "..."} and {"error": {"message": "..."}}.
 */
export function extractErrorMessage(
  error,
  fallback = "Something went wrong. Please try again."
) {
  if (error?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (error?.code === "ERR_CANCELED") return "Request cancelled.";
  if (error?.request && !error?.response) {
    return `Cannot reach the server at ${API_BASE_URL}. Check that the backend is running and CORS is configured.`;
  }
  const data = error?.response?.data;
  if (data) {
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
    if (typeof data.message === "string") return data.message;
    if (typeof data.error?.message === "string") return data.error.message;
  }
  if (error?.response?.status) return `Server error (${error.response.status}).`;
  return error?.message || fallback;
}

export default api;
