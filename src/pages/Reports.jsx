import { useSearchParams } from "react-router-dom";
import ModuleTabs from "../components/ModuleTabs";
import { MODULES } from "../modules";
import CaseHistory from "./CaseHistory";

/**
 * Reports = archived cases whose task completed, per module. Built from each module's
 * existing history endpoint (filtered in the browser); no extra backend support needed.
 */
export default function Reports() {
  const [params, setParams] = useSearchParams();
  const key = MODULES[params.get("module")] ? params.get("module") : "detection";

  return (
    <div className="space-y-2">
      <header className="mb-4">
        <p className="label">Reports</p>
        <h1 className="mt-1 text-4xl font-semibold text-burgundy">Completed Investigations</h1>
        <p className="mt-2 font-display text-lg italic text-ink/70">Open a case to read its full report.</p>
      </header>
      <ModuleTabs value={key} onChange={(k) => setParams({ module: k })} />
      <CaseHistory key={key} module={MODULES[key]} pageSize={10} showFilters onlyStatus="completed" title="Filed Reports" emptyText="No completed cases on this page yet." />
    </div>
  );
}
