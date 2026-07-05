import { useState } from "react";
import { motion } from "framer-motion";
import { Play, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useSimulator } from "../hooks/useSimulator";
import "./EnterprisePages.css";

export default function Simulator() {
  const { baseline, result, loading, simulating, error, refresh, simulate } = useSimulator();
  const [overrides, setOverrides] = useState({
    added_obligations: 0,
    removed_obligations: 0,
    deadline_extension_days: 0,
    risk_mitigation: 0,
    priority_override: ""
  });

  const setField = (field, value) => {
    setOverrides((current) => ({ ...current, [field]: value }));
  };

  if (loading) {
    return (
      <div className="state-panel">
        <div className="enterprise-spinner" />
        <h2>Loading simulator baseline</h2>
        <p>RegMap is preparing the latest compliance model for impact simulation.</p>
      </div>
    );
  }

  if (!baseline && !error) {
    return (
      <div className="state-panel">
        <SlidersHorizontal size={28} />
        <h2>No simulation baseline</h2>
        <p>Upload and analyze a regulation before using the impact simulator.</p>
      </div>
    );
  }

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header">
        <div>
          <h1>Impact Simulator</h1>
          <p>Model changes to deadlines, priority, risk mitigation, and obligation scope before committing an implementation plan.</p>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-button" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="enterprise-button primary" onClick={() => simulate(overrides)} disabled={simulating || !baseline}>
            <Play size={16} /> {simulating ? "Simulating" : "Run Simulation"}
          </button>
        </div>
      </div>

      {error && (
        <div className="state-panel">
          <h3>Simulator error</h3>
          <p>{error}</p>
        </div>
      )}

      {baseline && (
        <div className="enterprise-grid">
          <section className="enterprise-card full">
            <div className="metric-row">
              <div className="metric-tile">
                <span className="metric-label">Baseline Score</span>
                <span className="metric-value">{baseline.compliance_score ?? 0}</span>
                <span className="metric-note">{baseline.title}</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Risk Score</span>
                <span className="metric-value">{baseline.risk_score ?? 0}</span>
                <span className="metric-note">Current risk model</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Priority</span>
                <span className={`status-chip ${String(baseline.priority).toLowerCase()}`}>{baseline.priority}</span>
                <span className="metric-note">Baseline urgency</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Departments</span>
                <span className="metric-value">{baseline.departments?.length || 0}</span>
                <span className="metric-note">Impacted functions</span>
              </div>
            </div>
          </section>

          <section className="enterprise-card">
            <h2>Simulation Controls</h2>
            <div className="field-stack" style={{ marginTop: 16 }}>
              <label>
                Added obligations
                <input type="number" min="0" value={overrides.added_obligations} onChange={(event) => setField("added_obligations", Number(event.target.value))} />
              </label>
              <label>
                Removed obligations
                <input type="number" min="0" value={overrides.removed_obligations} onChange={(event) => setField("removed_obligations", Number(event.target.value))} />
              </label>
              <label>
                Deadline extension days
                <input type="number" value={overrides.deadline_extension_days} onChange={(event) => setField("deadline_extension_days", Number(event.target.value))} />
              </label>
              <label>
                Risks mitigated
                <input type="number" min="0" value={overrides.risk_mitigation} onChange={(event) => setField("risk_mitigation", Number(event.target.value))} />
              </label>
              <label>
                Priority override
                <select value={overrides.priority_override} onChange={(event) => setField("priority_override", event.target.value)}>
                  <option value="">Use AI recalculation</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>
            </div>
          </section>

          <section className="enterprise-card wide">
            <h2>Simulation Result</h2>
            {!result ? (
              <p>Adjust the controls and run a simulation to recalculate compliance score, risk score, department impact, and priority.</p>
            ) : (
              <div className="split-list">
                <div className="metric-row">
                  <div className="metric-tile">
                    <span className="metric-label">Simulated Score</span>
                    <span className="metric-value">{result.simulated_score}</span>
                    <span className="metric-note">Delta {result.score_delta}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Priority</span>
                    <span className={`status-chip ${String(result.simulated_priority).toLowerCase()}`}>{result.simulated_priority}</span>
                    <span className="metric-note">Was {result.baseline_priority}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Obligations</span>
                    <span className="metric-value">{result.simulated_obligations}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Open Risks</span>
                    <span className="metric-value">{result.simulated_risks}</span>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Impact</th>
                        <th>Obligation Load</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.department_impact || []).map((item) => (
                        <tr key={item.department}>
                          <td>{item.department}</td>
                          <td><span className={`status-chip ${String(item.impact).toLowerCase()}`}>{item.impact}</span></td>
                          <td>{item.obligation_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </motion.div>
  );
}
