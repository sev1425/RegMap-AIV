import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GitCompareArrows, RefreshCw, ShieldAlert } from "lucide-react";
import { useConflict } from "../hooks/useConflict";
import "./EnterprisePages.css";

export default function ConflictDetector() {
  const { analyses, internal, comparison, loading, comparing, error, refresh, compare } = useConflict();
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  const internalConflicts = internal?.conflicts || [];
  const recommendations = internal?.recommendations || [];

  const severity = useMemo(() => {
    const value = comparison?.conflict_severity || (internalConflicts.length > 0 ? "High" : "Low");
    return String(value).toLowerCase();
  }, [comparison, internalConflicts.length]);

  if (loading) {
    return (
      <div className="state-panel">
        <div className="enterprise-spinner" />
        <h2>Loading conflict intelligence</h2>
        <p>RegMap is checking stored regulatory analyses and internal semantic conflicts.</p>
      </div>
    );
  }

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header">
        <div>
          <h1>Conflict Detector</h1>
          <p>Compare regulations and review semantic conflicts found in the latest analysis.</p>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-button" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="state-panel">
          <ShieldAlert size={28} color="#dc2626" />
          <h3>Conflict service unavailable</h3>
          <p>{error}</p>
        </div>
      )}

      {!error && analyses.length === 0 && (
        <div className="state-panel">
          <ShieldAlert size={28} />
          <h3>No analyses available</h3>
          <p>Upload and analyze at least one regulation before running conflict detection.</p>
        </div>
      )}

      {!error && analyses.length > 0 && (
        <div className="enterprise-grid">
          <section className="enterprise-card full">
            <div className="metric-row">
              <div className="metric-tile">
                <span className="metric-label">Stored Analyses</span>
                <span className="metric-value">{analyses.length}</span>
                <span className="metric-note">Available for comparison</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Internal Conflicts</span>
                <span className="metric-value">{internalConflicts.length}</span>
                <span className="metric-note">{internal?.document_title || "Latest document"}</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Severity</span>
                <span className={`status-chip ${severity}`}>
                  {comparison?.conflict_severity || (internalConflicts.length ? "High" : "Low")}
                </span>
                <span className="metric-note">AI semantic conflict score</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Resolutions</span>
                <span className="metric-value">{recommendations.length}</span>
                <span className="metric-note">Suggested remediation actions</span>
              </div>
            </div>
          </section>

          <section className="enterprise-card">
            <h2>Compare Regulations</h2>
            <p>Select two stored analyses to inspect added, removed, or modified obligations.</p>
            <div className="field-stack" style={{ marginTop: 16 }}>
              <label>
                Baseline
                <select value={idA} onChange={(event) => setIdA(event.target.value)}>
                  <option value="">Select analysis</option>
                  {analyses.map((item) => (
                    <option value={item.id} key={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Target
                <select value={idB} onChange={(event) => setIdB(event.target.value)}>
                  <option value="">Select analysis</option>
                  {analyses.map((item) => (
                    <option value={item.id} key={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
              <button className="enterprise-button primary" onClick={() => compare(idA, idB)} disabled={!idA || !idB || idA === idB || comparing}>
                <GitCompareArrows size={16} /> {comparing ? "Comparing" : "Run Comparison"}
              </button>
            </div>
          </section>

          <section className="enterprise-card wide">
            <h2>Comparison Result</h2>
            {!comparison ? (
              <p>Select two analyses to generate a semantic comparison report.</p>
            ) : (
              <div className="split-list">
                <div className="list-item">
                  <strong>{comparison.summary}</strong>
                  <span>Severity: {comparison.conflict_severity}</span>
                </div>
                <div className="metric-row">
                  <div className="metric-tile">
                    <span className="metric-label">Added</span>
                    <span className="metric-value">{comparison.added_obligations?.length || 0}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Removed</span>
                    <span className="metric-value">{comparison.removed_obligations?.length || 0}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Modified</span>
                    <span className="metric-value">{comparison.modified_obligations?.length || 0}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Risk Additions</span>
                    <span className="metric-value">{comparison.risk_changes?.added?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="enterprise-card wide">
            <h2>Internal Conflicts</h2>
            <div className="table-wrap">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {internalConflicts.length === 0 ? (
                    <tr><td colSpan="4">No internal conflicts detected in the latest analysis.</td></tr>
                  ) : internalConflicts.map((item) => (
                    <tr key={item.id}>
                      <td>{item.type}</td>
                      <td><span className={`status-chip ${String(item.severity).toLowerCase()}`}>{item.severity}</span></td>
                      <td>{item.description}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="enterprise-card">
            <h2>Suggested Resolutions</h2>
            <div className="split-list">
              {recommendations.length === 0 ? (
                <p>No conflict-specific recommendations are currently open.</p>
              ) : recommendations.map((item) => (
                <div className="list-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.recommendation}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}
