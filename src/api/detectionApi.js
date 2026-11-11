/**
 * SIGNATURE DETECTION module API. Finds WHERE signatures are in a document/image.
 * It never compares signatures, never produces a similarity score and never a verdict.
 * Independent of verificationApi.js (separate routes, fields and result shape).
 *
 * PROPOSED CONTRACT (ASSUMPTIONS, confirm with the backend developer):
 *
 *  POST /api/v1/signature-detection            multipart/form-data
 *       field: document   (ONE pdf/png/jpg/jpeg file)
 *       -> {task_id, status:"queued", message}
 *
 *  GET  /api/v1/signature-detection/{task_id}
 *       -> {task_id, status: queued|processing|completed|failed, message?, created_at?,
 *           result?: {
 *             signature_count: 2,
 *             detections: [{signature_id, confidence?, bounding_box:{x,y,width,height}, page?}],
 *             image_width?, image_height?,        // pixel size the boxes refer to
 *             annotated_image_url?                // optional ready-made annotated image
 *           },
 *           error?: {code, message}}
 *       `confidence` is optional (null if the model does not provide it); 0-1.
 *       bounding_box is in pixels, origin top-left, in the uploaded image's coordinates.
 *
 *  GET  /api/v1/signature-detection            -> {items:[{task_id,status,created_at,signature_count?}],
 *                                                   total?, page?, page_size?}
 *
 * All backend -> UI field mapping lives in the map* functions below.
 */
import api from "./axios";
import { STATUS_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from "./taskStatus";

const BASE = "/api/v1/signature-detection";

const mapTask = (d) => {
  const r = d.result;
  const detections = Array.isArray(r?.detections) ? r.detections : null;
  return {
    taskId: d.task_id,
    status: d.status,
    message: d.message ?? "",
    createdAt: d.created_at ?? null, // OPTIONAL
    result: r
      ? {
          // Count comes from the backend; if absent we fall back to the list length it sent.
          signatureCount:
            typeof r.signature_count === "number" ? r.signature_count : detections ? detections.length : null,
          detections: (detections ?? []).map((s) => ({
            id: s.signature_id ?? null,
            confidence: s.confidence ?? null,
            boundingBox: s.bounding_box ?? null,
            page: s.page ?? null,
          })),
          imageWidth: r.image_width ?? null,
          imageHeight: r.image_height ?? null,
          annotatedImageUrl: r.annotated_image_url ?? null,
        }
      : null,
    error: d.error ? { code: d.error.code, message: d.error.message } : null,
  };
};

const mapHistoryItem = (i) => ({
  taskId: i.task_id,
  status: i.status,
  createdAt: i.created_at,
  signatureCount: i.signature_count ?? null, // OPTIONAL
});

export const submitDetection = async (document) => {
  const formData = new FormData();
  formData.append("document", document);
  // Do NOT set Content-Type manually: the browser adds the multipart boundary.
  const { data } = await api.post(BASE, formData, { timeout: UPLOAD_TIMEOUT_MS });
  return { taskId: data.task_id, status: data.status, message: data.message ?? "" };
};

export const getDetectionStatus = async (taskId, { signal } = {}) => {
  const { data } = await api.get(`${BASE}/${encodeURIComponent(taskId)}`, { signal, timeout: STATUS_TIMEOUT_MS });
  return mapTask(data);
};

export const getDetectionHistory = async ({ page, pageSize } = {}) => {
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
