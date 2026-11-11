import { useSearchParams } from "react-router-dom";
import ModuleTabs from "../components/ModuleTabs";
import { MODULES } from "../modules";
import CaseHistory from "./CaseHistory";

/** Archives for both modules, one tab each. Only the active tab calls its own history API. */
export default function CaseArchives() {
  const [params, setParams] = useSearchParams();
  const key = MODULES[params.get("module")] ? params.get("module") : "detection";

  return (
    <div className="space-y-2">
      <header className="mb-4">
        <p className="label">Case archives</p>
        <h1 className="mt-1 text-4xl font-semibold text-burgundy">Every case on record</h1>
        <p className="mt-2 font-display text-lg italic text-ink/70">Select a folder to reopen its findings.</p>
      </header>
      <ModuleTabs value={key} onChange={(k) => setParams({ module: k })} />
      <CaseHistory key={key} module={MODULES[key]} pageSize={10} showFilters title="All Cases" />
    </div>
  );
}
