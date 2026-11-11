/**
 * SIGNATURE VERIFICATION module API. Compares TWO signature images and returns the
 * verification model's similarity score and verdict.
 * It never detects signatures in documents and takes no document upload.
 * Independent of detectionApi.js (separate routes, fields and result shape).
 * The frontend never calculates a verdict; it displays what the backend returns.
 *
 * PROPOSED CONTRACT (ASSUMPTIONS, confirm with the backend developer):
 *
 *  POST /api/v1/signature-verification         multipart/form-data
 *       fields: original_signature  (png/jpg/jpeg, the genuine reference)
 *               suspected_signature (png/jpg/jpeg, the one being examined)
 *       -> {task_id, status:"queued", message}
 *
 *  GET  /api/v1/signature-verification/{task_id}
 *       -> {task_id, status: queued|processing|completed|failed, message?, created_at?,
 *           result?: {
 *             similarity_score: 92.5,            // 0-100
 *             verdict: "genuine" | "forged" | "inconclusive",   // decided by the backend
 *             threshold?: 80,                    // decision threshold used, if you want it shown
 *             metrics?: {"cosine_similarity": 0.93, ...}        // any extra numbers/strings
 *           },
 *           error?: {code, message}}
 *
 *  GET  /api/v1/signature-verification         -> {items:[{task_id,status,created_at,
 *                                                   similarity_score?, verdict?}], total?, page?, page_size?}
 *
 * REPLACES the earlier combined endpoint (/api/v1/signature-verifications, document +
 * reference_signature), which mixed detection data with a similarity score.
 */
import api from "./axios";
import { STATUS_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from "./taskStatus";

const BASE = "/api/v1/signature-verification";

// Accepts {name: value} or [{name, value}]; anything else -> [].
const mapMetrics = (m) => {
  if (Array.isArray(m)) return m.filter((x) => x && x.name !== undefined).map((x) => ({ name: String(x.name), value: x.value }));
  if (m && typeof m === "object") return Object.entries(m).map(([name, value]) => ({ name, value }));
  return [];
};

const mapTask = (d) => ({
  taskId: d.task_id,
  status: d.status,
  message: d.message ?? "",
  createdAt: d.created_at ?? null, // OPTIONAL
  result: d.result
    ? {
        // Missing values stay null; the UI never treats "missing" as "genuine".
        similarityScore: d.result.similarity_score ?? null,
        verdict: d.result.verdict ?? null,
        threshold: d.result.threshold ?? null, // OPTIONAL
        metrics: mapMetrics(d.result.metrics), // OPTIONAL
      }
    : null,
  error: d.error ? { code: d.error.code, message: d.error.message } : null,
});

const mapHistoryItem = (i) => ({
  taskId: i.task_id,
  status: i.status,
  createdAt: i.created_at,
  similarityScore: i.similarity_score ?? null,
  verdict: i.verdict ?? null, // OPTIONAL
});

export const submitVerification = async (originalSignature, suspectedSignature) => {
  const formData = new FormData();
  formData.append("original_signature", originalSignature);
  formData.append("suspected_signature", suspectedSignature);
  // Do NOT set Content-Type manually: the browser adds the multipart boundary.
  const { data } = await api.post(BASE, formData, { timeout: UPLOAD_TIMEOUT_MS });
  return { taskId: data.task_id, status: data.status, message: data.message ?? "" };
};

export const getVerificationStatus = async (taskId, { signal } = {}) => {
  const { data } = await api.get(`${BASE}/${encodeURIComponent(taskId)}`, { signal, timeout: STATUS_TIMEOUT_MS });
  return mapTask(data);
};

export const getVerificationHistory = async ({ page, pageSize } = {}) => {
  const params = {};
  if (page) params.page = page;
  if (pageSize) params.page_size = pageSize;
  const { data } = await api.get(BASE, { params });
  const items = Array.isArray(data) ? data : data.items ?? [];
  return {
    items: items.map(mapHistoryItem),
    total: data.total ?? null,
    page: data.page ?? page ?? 1,
    pageSize: data.page_size ?? pageSize ?? null,
  };
};
