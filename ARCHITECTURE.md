# Architecture in 5 minutes

The app does **two separate jobs**. They never depend on each other.

> This repo is the **React frontend only**. The backend (FastAPI, Celery, RabbitMQ, ML models) is built separately.

## Where do I start?

| I am... | Read | Time |
|---|---|---|
| Backend developer | [§3 Backend checklist](#3-backend-checklist), then [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) (exact JSON) | 10 min |
| Frontend developer | [§4 Frontend map](#4-frontend-map) | 3 min |
| Just want to try it | [§5 Run and test](#5-run-and-test) | 2 min |

**Contents:** [1. The two jobs](#1-the-two-jobs) · [2. How a request flows](#2-how-a-request-flows) · [3. Backend checklist](#3-backend-checklist) · [4. Frontend map](#4-frontend-map) · [5. Run and test](#5-run-and-test) · [6. What was verified](#6-what-was-verified)

---

## 1. The two jobs

| | **Signature Detection** | **Signature Verification** |
|---|---|---|
| Question it answers | *Where* are the signatures? | *Is this signature genuine?* |
| You upload | 1 document or image | 2 signature images (original + suspected) |
| You get back | Count, box positions, confidence (optional) | Similarity score, **verdict**, threshold + metrics (optional) |
| It never | compares, scores or judges | detects, takes a document, or reuses detection confidence |
| Web address | `/detection` | `/verification` |
| API | `/api/v1/signature-detection` | `/api/v1/signature-verification` |

**Shared** (one copy for both): login, the HTTP client, the four task statuses, the polling timer, the database, the message broker.
**Not shared:** routes, schemas, business logic, ML model, background task, result handling.

## 2. How a request flows

Same shape for both modules, but each has its **own** lane and they never cross:

```
 Browser                 FastAPI                    RabbitMQ          Worker
 ───────                 ───────                    ────────          ──────
 upload files  ───►  POST /signature-XXXX  ──►  queue "XXXX"  ──►  XXXX task + XXXX model
               ◄───  { task_id }  (instant)
 every 2.5 s   ───►  GET /signature-XXXX/{id}  ◄── status + result
 (stops on completed / failed)

 XXXX = detection  or  verification   (two lanes, never mixed)
```

Task statuses (both modules): `queued` → `processing` → `completed` or `failed`.

## 3. Backend checklist

**Build two groups of endpoints.** Detection and verification each get their own:

- [ ] router, request schema, response schema
- [ ] service (validation + creating the task)
- [ ] Celery task (`detect_signatures_task` / `verify_signature_task`)
- [ ] model loading + inference
- [ ] status and history endpoints

**Suggested layout:**

```
app/
  core/            shared: auth, db, settings, logging, celery_app.py
  modules/
    detection/     router.py  schemas.py  service.py  tasks.py  model.py
    verification/  router.py  schemas.py  service.py  tasks.py  model.py
```

**Rules**

| Do | Don't |
|---|---|
| Return the `task_id` immediately, run the model in the background | Hold the upload request open while the model runs |
| Give each module its own Celery queue and worker (`-Q detection`, `-Q verification`) | Let one slow module block the other |
| Let the verification model decide `verdict` and apply the threshold | Expect the frontend to calculate a verdict |
| Keep both modules on the same FastAPI app, broker and database | Make detection trigger verification (or the reverse) |
| | Add one generic endpoint that "decides" which module to run |

Exact fields, units and JSON examples are in **[BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)**. The route names are proposals; tell the frontend developer if you choose different ones (a one-line change).

## 4. Frontend map

```
src/api/        talks to the backend. The ONLY place with URLs.
  detectionApi.js       detection routes + response mapping
  verificationApi.js    verification routes + response mapping
  authApi.js, axios.js, taskStatus.js     shared
src/hooks/      polling. useTaskPolling is shared; the other two just pick a module.
src/pages/      one page per screen
  DetectionWorkspace.jsx      /detection     (1 upload, boxes)
  VerificationWorkspace.jsx   /verification  (2 uploads, verdict)
  CaseArchives / Reports / InvestigationRoom / Login / Profile
src/components/ display only, no network calls
  DetectionReport, BoundingBoxViewer, EvidenceCard        detection only
  VerificationReport, ScoreGauge                          verification only
  everything else is generic
```

**Five rules the code follows**

1. Detection and verification are separate pages; no form mixes them.
2. A detection page never calls a verification endpoint, and vice versa.
3. Components never call the API; pages and hooks do.
4. Results are shown exactly as the backend sends them. Missing means "Not reported", never "success".
5. Progress steps on screen are decoration based on the status; no fake percentages.

**Backend field renamed?** Edit that module's `map…` function in `src/api/`. Nothing else changes.

## 5. Run and test

```bash
npm install
npm run mock     # fake backend on :8000 (delete mock-server/ later)
npm run dev      # app on :5173
```

Log in with any email and any password (`wrong` fails on purpose). Then:

| Try this | Expect |
|---|---|
| **Signature Detection** → upload one image | Count + numbered boxes. No score, no verdict. |
| **Signature Verification** → upload two images | Similarity gauge + verdict. No boxes. |
| Both at once, in two tabs | Both finish. `http://localhost:8000/__stats` shows separate counters. |
| Detection filename with `two` / `none` / `fail` | 2 signatures / 0 signatures / failure |
| Verification filename with `forged` / `unsure` / `fail` | forged / inconclusive / failure |

**Using the real backend:** set `VITE_API_BASE_URL` in `.env`, restart `npm run dev`, and repeat the table.

## 6. What was verified

- **Tested (frontend):** an automated browser run (52 checks, production build) confirmed each page only calls its own endpoints, the right upload fields are sent, results render per module, both modules run side by side, and failures and mobile layouts work.
- **Not tested:** the real backend (FastAPI, Celery, RabbitMQ, ML models), because it is not in this repo.
