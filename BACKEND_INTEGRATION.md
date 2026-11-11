# Backend Integration Guide

For the developer building the FastAPI backend. You do not need to read the React code: this file is the contract. See [ARCHITECTURE.md](ARCHITECTURE.md) for how the two modules are kept separate.

The frontend only makes plain REST calls (JSON, plus multipart uploads) and **polls** for task status. No WebSockets, no extra endpoints, no data for animations. All theming is client-side.

**Contents:** [1 What to implement](#1-what-to-implement) · [2 Base URL and CORS](#2-base-url-and-cors) · [3 Authentication](#3-authentication-assumption-jwt-bearer-please-confirm) · [4 Task lifecycle](#4-task-lifecycle-both-modules) · [5 Detection](#5-signature-detection) · [6 Verification](#6-signature-verification) · [7 Errors](#7-errors) · [8 Where to edit the frontend](#8-where-to-edit-the-frontend-if-the-contract-changes) · [9 Try without a backend](#9-trying-the-frontend-before-your-backend-exists)

**In a hurry?** Build the 9 endpoints in the table below, return a `task_id` immediately from each POST, and use the JSON examples in sections 5 and 6 as the shapes. Anything marked *optional* can be left out.

## 1. What to implement

Two independent route groups plus auth. **No endpoint is shared between detection and verification.**

| # | Method | Path | Auth | Module |
|---|--------|------|------|--------|
| 1 | POST | `/api/v1/auth/login` | no | auth |
| 2 | GET | `/api/v1/auth/me` | yes | auth |
| 3 | POST | `/api/v1/auth/logout` | yes | auth |
| 4 | POST | `/api/v1/signature-detection` | yes | **Detection** |
| 5 | GET | `/api/v1/signature-detection/{task_id}` | yes | **Detection** |
| 6 | GET | `/api/v1/signature-detection` | yes | **Detection** (history) |
| 7 | POST | `/api/v1/signature-verification` | yes | **Verification** |
| 8 | GET | `/api/v1/signature-verification/{task_id}` | yes | **Verification** |
| 9 | GET | `/api/v1/signature-verification` | yes | **Verification** (history) |

> **Change from the earlier contract:** the single combined `POST /api/v1/signature-verifications` (document + `reference_signature`) is **no longer called** by the frontend. It mixed detection output with a similarity score. If you already started on it, split it into the two groups above. These route names are proposals: if you prefer others, tell the frontend developer (one-line change per module, see section 8).

## 2. Base URL and CORS

- Base URL: `.env` → `VITE_API_BASE_URL` (default `http://localhost:8000`). Read in `src/api/axios.js` only. Restart `npm run dev` after changing it.
- Enable CORS for the frontend origin and allow the `Authorization` header:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])
```

## 3. Authentication (assumption: JWT bearer, please confirm)

- `POST /auth/login` returns `access_token`. The frontend stores it and sends `Authorization: Bearer <token>` on every other call. A `401` on any non-login call returns the user to the login screen.
- Cookie sessions instead? Tell the frontend developer (small change in `src/api/axios.js`; needs CORS `allow_credentials=True` with explicit origins).

**`POST /api/v1/auth/login`** request `{ "email": "user@example.com", "password": "password123" }`
→ `200 { "access_token": "jwt", "token_type": "bearer", "user": { "id": 1, "email": "user@example.com", "full_name": "John Doe" } }`
(if `user` is omitted the frontend calls `/auth/me`). Failure: `401 {"detail": "Incorrect email or password."}`.

**`GET /api/v1/auth/me`** → `200 { "id": 1, "email": "...", "full_name": "..." }`, `401` if invalid/expired.
**`POST /api/v1/auth/logout`** → any `2xx` (the frontend clears its token regardless).

## 4. Task lifecycle (both modules)

Both modules use the same four status strings: `queued` · `processing` · `completed` · `failed`.

- The POST returns **immediately** with a `task_id`; never hold the request while the model runs.
- The frontend polls `GET .../{task_id}` every **2.5 s** (10 s timeout per request) until `completed` or `failed`.
- `message` (optional, any status) is free text; the UI shows it verbatim as an "examiner's note".
- `failed` must include `error`: `{ "code": "PROCESSING_ERROR", "message": "Unable to process the uploaded file." }`.
- Do not report `completed` unless `result` is populated. Unknown `task_id` → `404`.
- `created_at` (ISO-8601) is **optional** on task detail; shown as "Date and time filed" if present.

## 5. Signature Detection

Purpose: locate signatures in one document/image. **No comparison, no similarity, no verdict.**

### `POST /api/v1/signature-detection`
`multipart/form-data`, one field:

| Field | Allowed | Frontend limit (assumption) |
|-------|---------|-----------------------------|
| `document` | pdf, png, jpg, jpeg | 10 MB |

Response `202`/`200`: `{ "task_id": "det_12345", "status": "queued", "message": "Detection request submitted successfully" }` (only `task_id` is required).

### `GET /api/v1/signature-detection/{task_id}`
Processing: `{ "task_id": "det_12345", "status": "processing", "message": "Detecting signatures..." }`

Completed:
```json
{
  "task_id": "det_12345",
  "status": "completed",
  "created_at": "2026-11-09T12:00:00Z",
  "result": {
    "signature_count": 2,
    "detections": [
      { "signature_id": 1, "confidence": 0.98, "bounding_box": { "x": 120, "y": 240, "width": 180, "height": 90 }, "page": 1 },
      { "signature_id": 2, "confidence": 0.91, "bounding_box": { "x": 320, "y": 60, "width": 150, "height": 60 } }
    ],
    "image_width": 600,
    "image_height": 400,
    "annotated_image_url": "https://.../annotated.png"
  }
}
```

| Field | Notes |
|-------|-------|
| `signature_count` | number of signatures found; `0` is valid (UI says "no signatures detected") |
| `detections[].confidence` | **optional**, 0-1. Omit/`null` if the model has none: the UI shows "Not reported" |
| `detections[].bounding_box` | **pixels**, `x`/`y` = top-left, in the coordinate space of the uploaded image. The UI draws these over the user's image and crops evidence previews |
| `detections[].page` | optional (multi-page PDFs) |
| `image_width/height` | optional |
| `annotated_image_url` | **optional**. Must load in an `<img>` without an Authorization header (public or signed URL). If present the user can switch to it |

For PDFs the UI lists the regions but cannot draw boxes (no PDF renderer in the browser).

### `GET /api/v1/signature-detection` (history)
Optional query: `page` (1-based), `page_size`.
```json
{ "items": [ { "task_id": "det_12345", "status": "completed", "created_at": "2026-11-09T12:00:00Z", "signature_count": 2 } ],
  "total": 42, "page": 1, "page_size": 10 }
```
Required per item: `task_id`, `status`, `created_at`. `signature_count` optional. `total/page/page_size` optional (a bare array is also accepted). Only the logged-in user's tasks, newest first.

## 6. Signature Verification

Purpose: compare two signature images. **No document, no detection.** The backend model decides the verdict; the frontend never computes or overrides it.

### `POST /api/v1/signature-verification`
`multipart/form-data`, two fields:

| Field | Allowed | Frontend limit (assumption) |
|-------|---------|-----------------------------|
| `original_signature` (genuine reference) | png, jpg, jpeg | 5 MB |
| `suspected_signature` (to examine) | png, jpg, jpeg | 5 MB |

Response: `{ "task_id": "ver_12345", "status": "queued", "message": "Verification request submitted successfully" }`.

### `GET /api/v1/signature-verification/{task_id}`
Completed:
```json
{
  "task_id": "ver_12345",
  "status": "completed",
  "created_at": "2026-11-09T12:00:00Z",
  "result": {
    "similarity_score": 92.5,
    "verdict": "genuine",
    "threshold": 80,
    "metrics": { "cosine_similarity": 0.925, "euclidean_distance": 0.31 }
  }
}
```

| Field | Notes |
|-------|-------|
| `similarity_score` | **0-100** (already a percentage) |
| `verdict` | **backend decides**: `genuine`, `forged` or `inconclusive`. Shown verbatim; if missing the UI shows "Not reported" (it never infers one from the score) |
| `threshold` | optional; shown as "Decision threshold" |
| `metrics` | optional; `{name: value}` (or `[{name, value}]`), every entry is listed as "Evaluation metrics" |

### `GET /api/v1/signature-verification` (history)
Same paging rules as detection:
```json
{ "items": [ { "task_id": "ver_12345", "status": "completed", "created_at": "2026-11-09T12:00:00Z",
               "similarity_score": 92.5, "verdict": "genuine" } ],
  "total": 17, "page": 1, "page_size": 10 }
```
`similarity_score` is `null` until completed; `verdict` optional.

## 7. Errors

Return normal FastAPI errors; the frontend shows the first match: `{"detail": "text"}` → `{"detail": [{"msg": "..."}]}` (joined) → `{"message": "..."}` / `{"error": {"message": "..."}}` → `Server error (<status>)`. Network/CORS failures show "Cannot reach the server at <base url>...". The UI never pretends an operation succeeded. Please still validate file types/sizes on the server.

## 8. Where to edit the frontend if the contract changes

| Change | File |
|--------|------|
| Base URL | `.env` (`VITE_API_BASE_URL`) |
| Token storage / auth header / cookies / error parsing | `src/api/axios.js` |
| Login / me / logout | `src/api/authApi.js` |
| **Detection** paths, upload field, **every detection response field** | `src/api/detectionApi.js` |
| **Verification** paths, upload fields, **every verification response field** | `src/api/verificationApi.js` |
| Status strings, timeouts shared by both | `src/api/taskStatus.js` |
| Polling interval / retries | `src/hooks/useTaskPolling.js` |
| File types / size limits | `src/utils/fileValidation.js` |
| Status / stage wording | `src/utils/caseLabels.js`, `src/utils/stages.js` |

UI components only read the camelCase objects produced by the `map*` functions in the two API files, so a renamed backend field is a one-line change there.

## 9. Trying the frontend before your backend exists

`npm run mock` starts a dev-only mock (`mock-server/server.mjs`, port 8000) implementing exactly this contract with two independent route groups (and a `GET /__stats` counter). Delete the folder once the real backend is running.
Mock behaviour: any email + any password signs in (`wrong` → 401). Detection: filename containing `fail` → failed, `none` → 0 signatures, `two` → 2 signatures, `noconf` → no confidence. Verification: `fail` → failed, `forged` → 23.1 forged, `unsure` → 55 inconclusive, otherwise 94.2 genuine.
