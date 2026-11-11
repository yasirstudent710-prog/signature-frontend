# Signature Verification System: Frontend

React + Vite frontend for the AI signature verification service. It talks **only** to the FastAPI backend over HTTP. Queueing (RabbitMQ), workers (Celery) and ML live entirely in the backend.

Stack: React, Vite, JavaScript, React Router, Axios, Tailwind CSS v4, Lucide icons.

## Documentation

| Doc | For | What's in it |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | everyone, start here | The two modules (detection / verification), how they stay separate, 5-minute overview |
| [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) | backend developer | Every endpoint, field, unit and JSON example |

## Install and run

```bash
npm install
cp .env.example .env      # then edit if your backend is not on localhost:8000
npm run dev               # http://localhost:5173
npm run build             # production build in dist/
npm run preview           # serve the production build locally
```

The app starts even when the backend is down. API failures are shown as readable messages (for example "Cannot reach the server at ...") and nothing is faked.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL for every API request |

Vite reads `.env` at startup, so restart `npm run dev` after changing it.

## Connecting the real FastAPI backend

1. Start FastAPI and set `VITE_API_BASE_URL` to its URL.
2. **Enable CORS** in FastAPI for the frontend origin (`http://localhost:5173` in dev):
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_methods=["*"],
       allow_headers=["*"],   # Authorization header is required
   )
   ```
   If you switch to cookie auth, also set `allow_credentials=True` (with explicit origins, not `*`).
3. Sign in. Compare any mismatches against the contracts below. Only `src/api/` needs editing.

## Code map

```
src/api/axios.js             Axios instance, base URL, token storage, auth header, 401 handling, error-message extraction
src/api/authApi.js           login / me / logout + user mapping
src/api/detectionApi.js      DETECTION endpoints + response mapping
src/api/verificationApi.js   VERIFICATION endpoints + response mapping
src/api/taskStatus.js        shared status strings / timeouts
src/hooks/useTaskPolling.js  shared polling mechanism (2.5s, stops on completed/failed, aborts on unmount)
src/hooks/useDetectionPolling.js, useVerificationPolling.js   bind it to each module
src/context/AuthContext.jsx  session state
src/routes/ProtectedRoute.jsx
src/components/              AppLayout, Sidebar, Navbar, FileUploader, InvestigationAnimation, CaseFile,
                             DetectionReport, BoundingBoxViewer, EvidenceCard,   (detection)
                             VerificationReport, ScoreGauge,                     (verification)
                             StatusBadge, ModuleTabs, Emblem, Ornament, OfficeIllustration
src/pages/                   Login, InvestigationRoom, DetectionWorkspace, VerificationWorkspace,
                             CaseArchives, Reports, Profile, CaseHistory (list container)
src/utils/fileValidation.js  allowed types and size limits
src/utils/caseLabels.js      themed status wording + formatting helpers
```

No endpoint URL appears in any component or page. The "Sherlock Holmes" theme is purely visual; see **[BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)** for the one-file contract to hand to the backend developer.

### Theme
Colour tokens and fonts (Playfair Display, Inter, IBM Plex Mono via Google Fonts) are defined in `src/index.css`. Animations respect `prefers-reduced-motion`.

### Previewing without a backend
`npm run mock` starts a dev-only mock API on port 8000 (`mock-server/`). It is not part of the app; delete the folder once the real backend is connected.

### Changing the auth strategy
Everything is in `src/api/axios.js` (marked with comments): token key and storage, `Authorization: Bearer` header, and the commented-out `withCredentials: true` for cookie sessions. The login response mapping is in `authApi.js`.

## API contracts

See **[BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)** for every endpoint, request field and JSON example (items marked ASSUMPTION need confirmation), and **[ARCHITECTURE.md](ARCHITECTURE.md)** for how Signature Detection and Signature Verification are kept independent.

## Behaviour notes

- The upload request returns as soon as the task id comes back. Status is then polled separately every 2.5 s with a 10 s per-request timeout.
- Polling never overlaps (the next poll is scheduled after the previous one finishes), stops on `completed`/`failed`, and is cancelled (timer and in-flight request) on unmount or when the task changes.
- Transient poll errors are retried; after 5 in a row, or on 404, the UI shows the error with a Retry button.
- The active task is kept in the URL (`/?task=<id>`), so refreshing or clicking a history row re-fetches that task from the status endpoint.
