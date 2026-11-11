import { AlertCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractErrorMessage } from "../api/axios";
import CaseFile from "../components/CaseFile";
import { STATUS_FILTERS } from "../utils/caseLabels";

/**
 * History list for ONE module. It makes a single call to that module's own history function
 * (`module.fetchHistory`, see src/modules.js), so a detection list never touches the
 * verification endpoint and vice versa. Presentation lives in <CaseFile/>.
 * Opening a case navigates to the module's workspace: "<module.path>?task=<id>".
 *
 * Pagination ASSUMPTION: backend accepts ?page=&page_size= and may return `total`.
 * Search/status filtering run in the browser over the loaded page (no extra API params).
 *
 * @param module       an entry of MODULES
 * @param refreshKey   change to reload the list
 * @param onlyStatus   optionally lock to one status (used by Reports)
 */
export default function CaseHistory({
  module, pageSize = 10, compact = false, refreshKey, selectedTaskId,
  showFilters = false, onlyStatus = null, title = "Case Archives",
  emptyText = "The archive is empty. No cases have been opened yet.",
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(() => setReloadTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    module
      .fetchHistory({ page, pageSize })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(extractErrorMessage(err, "Could not load the archive.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [module, page, pageSize, refreshKey, reloadTick]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items.filter(
      (i) =>
        (!onlyStatus || i.status === onlyStatus) &&
        (statusFilter === "all" || i.status === statusFilter) &&
        (!q || String(i.taskId).toLowerCase().includes(q))
    );
  }, [data.items, query, statusFilter, onlyStatus]);

  const totalPages = data.total != null ? Math.max(1, Math.ceil(data.total / pageSize)) : null;
  const hasNext = totalPages != null ? page < totalPages : data.items.length >= pageSize;
  const showPager = !compact && (page > 1 || hasNext);
  const filtering = query.trim() !== "" || statusFilter !== "all" || onlyStatus;

  const openCase = (item) =>
    navigate(`${module.path}?task=${encodeURIComponent(item.taskId)}`, { state: { createdAt: item.createdAt } });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Evidence register · {module.title}</p>
          <h2 className="mt-1 text-2xl font-semibold text-burgundy">{compact ? "Recent Cases" : title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {compact && <Link to={`/archives?module=${module.key}`} className="text-sm font-medium text-burgundy underline decoration-brass underline-offset-4 hover:text-burgundy-dark">View all archives</Link>}
          <button onClick={load} className="rounded p-1.5 text-brass-dark transition-colors hover:bg-brass/15" aria-label={`Refresh ${module.title} archive`} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brass-dark" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by case ID" aria-label="Search by case ID" className="input-field pl-9" />
          </div>
          {!onlyStatus && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="input-field sm:w-60">
              {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          )}
        </div>
      )}

      {error ? (
        <div className="paper flex items-start gap-2 p-4 text-sm text-oxblood" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      ) : loading && data.items.length === 0 ? (
        <div className="paper flex items-center justify-center gap-2 p-10 text-sm text-ink/70">
          <Loader2 className="h-4 w-4 animate-spin" /> Retrieving the archive…
        </div>
      ) : visible.length === 0 ? (
        <p className="paper p-10 text-center text-sm text-ink/70">
          {filtering && data.items.length > 0 ? "No cases on this page match your search." : emptyText}
        </p>
      ) : (
        <ul className="grid gap-6 pt-3">
          {visible.map((item) => (
            <CaseFile key={item.taskId} item={item} facts={module.facts(item)} selected={selectedTaskId === item.taskId} onOpen={openCase} />
          ))}
        </ul>
      )}

      {filtering && !error && data.items.length > 0 && visible.length > 0 && (
        <p className="mt-3 text-xs text-ink/55">Showing {visible.length} of {data.items.length} cases on this page.</p>
      )}

      {showPager && (
        <div className="mt-5 flex items-center justify-between text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className="btn-ghost !px-3 !py-1.5">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="mono text-xs text-ink/60">Page {page}{totalPages ? ` of ${totalPages}` : ""}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext || loading} className="btn-ghost !px-3 !py-1.5">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
