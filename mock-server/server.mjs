/**
 * DEV-ONLY mock of the FastAPI backend, so the UI can be previewed before the real backend
 * exists. NOT part of the app bundle. Delete this folder when the backend is ready.
 *
 * Run:  npm run mock     (http://localhost:8000)
 *
 * It mirrors the intended separation: two INDEPENDENT route groups with their own task
 * stores, handlers and field validation. Nothing is shared except auth/CORS plumbing.
 *
 *  Detection    POST/GET /api/v1/signature-detection[/{id}]      field: document
 *  Verification POST/GET /api/v1/signature-verification[/{id}]   fields: original_signature, suspected_signature
 *  Dev only     GET /__stats   per-module counters, used to prove the modules don't touch each other
 *
 * Demo behaviour (task: queued 2s -> processing 3s -> done):
 *  - Login: any valid email + any password, EXCEPT password "wrong" -> 401.
 *  - Detection:    filename contains "fail" -> failed | "none" -> 0 signatures | "two" -> 2 signatures
 *                  | "noconf" -> boxes without confidence | otherwise 1 signature
 *  - Verification: filename contains "fail" -> failed | "forged" -> 23.1 forged | "unsure" -> 55 inconclusive
 *                  | otherwise 94.2 genuine
 */
import http from "node:http";

const PORT = 8000;
const stats = { detection: { submitted: 0, polled: 0 }, verification: { submitted: 0, polled: 0 } };

const send = (res, code, body) => {
  res.writeHead(code, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
};

const multipartFiles = (raw) =>
  Object.fromEntries([...raw.matchAll(/name="(\w+)"; filename="([^"]*)"/g)].map((m) => [m[1], m[2]]));

const phase = (t) => {
  const age = (Date.now() - t.created) / 1000;
  if (age < 2) return { status: "queued", message: "Waiting in queue..." };
  if (age < 5) return { status: "processing", message: t.processingMessage };
  return { status: t.fail ? "failed" : "completed" };
};
const failed = (id) => ({ task_id: id, status: "failed", error: { code: "PROCESSING_ERROR", message: "Unable to process the uploaded file." } });

/* ============================ DETECTION MODULE ============================ */
const detection = (() => {
  const tasks = new Map();
  let counter = 2000;

  const resultOf = (t) => {
    const boxes = [{ signature_id: 1, bounding_box: { x: 120, y: 240, width: 180, height: 90 } }, { signature_id: 2, bounding_box: { x: 320, y: 60, width: 150, height: 60 } }];
    const picked = t.none ? [] : t.two ? boxes : boxes.slice(0, 1);
    return {
      signature_count: picked.length,
      detections: picked.map((b) => (t.noconf ? b : { ...b, confidence: b.signature_id === 1 ? 0.98 : 0.91 })),
    };
  };
  const detail = (id) => {
    const t = tasks.get(id);
    const p = phase(t);
    if (p.status === "failed") return failed(id);
    if (p.status !== "completed") return { task_id: id, status: p.status, message: p.message };
    return { task_id: id, status: "completed", result: resultOf(t) };
  };

  return {
    submit(files) {
      if (!files.document) return [422, { detail: [{ msg: "Field 'document' is required." }] }];
      const n = files.document;
      const id = `det_${++counter}`;
      tasks.set(id, { created: Date.now(), fail: /fail/i.test(n), none: /none/i.test(n), two: /two/i.test(n), noconf: /noconf/i.test(n), processingMessage: "Detecting signatures..." });
      stats.detection.submitted++;
      return [202, { task_id: id, status: "queued", message: "Detection request submitted successfully" }];
    },
    get(id) {
      if (!tasks.has(id)) return [404, { detail: "Task not found" }];
      stats.detection.polled++;
      return [200, detail(id)];
    },
    list(page, size) {
      stats.detection.polled += 0;
      const all = [...tasks.entries()].reverse().map(([id, t]) => {
        const d = detail(id);
        return { task_id: id, status: d.status, created_at: new Date(t.created).toISOString(), ...(d.result ? { signature_count: d.result.signature_count } : {}) };
      });
      return [200, { items: all.slice((page - 1) * size, page * size), total: all.length, page, page_size: size }];
    },
  };
})();

/* =========================== VERIFICATION MODULE ========================== */
const verification = (() => {
  const tasks = new Map();
  let counter = 3000;

  const detail = (id) => {
    const t = tasks.get(id);
    const p = phase(t);
    if (p.status === "failed") return failed(id);
    if (p.status !== "completed") return { task_id: id, status: p.status, message: p.message };
    return {
      task_id: id,
      status: "completed",
      result: { similarity_score: t.score, verdict: t.verdict, threshold: 80, metrics: { cosine_similarity: +(t.score / 100).toFixed(3), euclidean_distance: +((100 - t.score) / 100).toFixed(3) } },
    };
  };

  return {
    submit(files) {
      if (!files.original_signature || !files.suspected_signature) {
        return [422, { detail: [{ msg: "Fields 'original_signature' and 'suspected_signature' are required." }] }];
      }
      const names = `${files.original_signature} ${files.suspected_signature}`;
      const id = `ver_${++counter}`;
      const forged = /forged/i.test(names), unsure = /unsure/i.test(names);
      tasks.set(id, {
        created: Date.now(), fail: /fail/i.test(names),
        score: forged ? 23.1 : unsure ? 55 : 94.2,
        verdict: forged ? "forged" : unsure ? "inconclusive" : "genuine",
        processingMessage: "Comparing signatures...",
      });
      stats.verification.submitted++;
      return [202, { task_id: id, status: "queued", message: "Verification request submitted successfully" }];
    },
    get(id) {
      if (!tasks.has(id)) return [404, { detail: "Task not found" }];
      stats.verification.polled++;
      return [200, detail(id)];
    },
    list(page, size) {
      const all = [...tasks.entries()].reverse().map(([id, t]) => {
        const d = detail(id);
        return { task_id: id, status: d.status, created_at: new Date(t.created).toISOString(), similarity_score: d.result?.similarity_score ?? null, ...(d.result ? { verdict: d.result.verdict } : {}) };
      });
      return [200, { items: all.slice((page - 1) * size, page * size), total: all.length, page, page_size: size }];
    },
  };
})();

/* ================================ ROUTER ================================== */
const GROUPS = { "signature-detection": detection, "signature-verification": verification };

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") return send(res, 204, {});
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("latin1");
      const p = url.pathname;

      if (p === "/__stats") return send(res, 200, stats);

      if (p === "/api/v1/auth/login" && req.method === "POST") {
        let b = {};
        try { b = JSON.parse(raw); } catch { /* ignore */ }
        if (!b.email || !b.password || b.password === "wrong") return send(res, 401, { detail: "Incorrect email or password." });
        return send(res, 200, { access_token: "mock-token", token_type: "bearer", user: { id: 1, email: b.email, full_name: "Demo User" } });
      }

      const authed = req.headers.authorization === "Bearer mock-token";
      if (p.startsWith("/api/v1/") && !authed) return send(res, 401, { detail: "Not authenticated" });
      if (p === "/api/v1/auth/me") return send(res, 200, { id: 1, email: "demo@example.com", full_name: "Demo User" });
      if (p === "/api/v1/auth/logout") return send(res, 200, { ok: true });

      const m = p.match(/^\/api\/v1\/(signature-detection|signature-verification)(?:\/([^/]+))?$/);
      if (m) {
        const group = GROUPS[m[1]];
        const [code, body] =
          req.method === "POST" && !m[2] ? group.submit(multipartFiles(raw))
          : req.method === "GET" && m[2] ? group.get(m[2])
          : req.method === "GET" ? group.list(Number(url.searchParams.get("page") || 1), Number(url.searchParams.get("page_size") || 10))
          : [405, { detail: "Method not allowed" }];
        return send(res, code, body);
      }

      send(res, 404, { detail: "Not found" });
    });
  })
  .listen(PORT, () => console.log(`Mock API running on http://localhost:${PORT}`));
