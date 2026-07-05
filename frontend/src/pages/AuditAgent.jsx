import { motion } from "framer-motion";
import { Download, FileText, RefreshCw } from "lucide-react";
import { getReportDownloadUrl } from "../api/reportApi";
import { useReport } from "../hooks/useReport";
import { useTimeline } from "../hooks/useTimeline";
import { useGlobalContext } from "../context/GlobalContext";
import "./EnterprisePages.css";

export default function AuditAgent() {
  const { deployedTasks } = useGlobalContext();
  const timeline = useTimeline();
  const report = useReport();
  const data = timeline.data;
  const reportData = report.data?.report || {};
  const kpis = reportData.compliance_kpis || {};
  const activities = data?.timeline || [];
  const missingEvidence = data?.missing_evidence || [];

  if (timeline.loading || report.loading) {
    return (
      <div className="state-panel">
        <div className="enterprise-spinner" />
        <h2>Loading audit intelligence</h2>
        <p>RegMap is preparing audit readiness, timeline, evidence gaps, and report exports.</p>
      </div>
    );
  }

  if (!data && !timeline.error) {
    return (
      <div className="state-panel">
        <FileText size={28} />
        <h2>No audit report available</h2>
        <p>Upload and analyze a regulation before generating audit intelligence.</p>
      </div>
    );
  }

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header">
        <div>
          <h1>Audit Intelligence</h1>
          <p>Review readiness, implementation timeline, missing evidence, recommendations, and exportable audit reports.</p>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-button" onClick={() => { timeline.refresh(); report.refresh(); }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <a className="enterprise-button primary" href={getReportDownloadUrl("pdf")}>
            <Download size={16} /> PDF
          </a>
          <a className="enterprise-button" href={getReportDownloadUrl("json")}>
            <Download size={16} /> JSON
          </a>
        </div>
      </div>

      {(timeline.error || report.error) && (
        <div className="state-panel">
          <h3>Audit data error</h3>
          <p>{timeline.error || report.error}</p>
        </div>
      )}

      {data && (
        <div className="enterprise-grid">
          <section className="enterprise-card full">
            <div className="metric-row">
              <div className="metric-tile">
                <span className="metric-label">Audit Readiness</span>
                <span className="metric-value">{data.audit_readiness}%</span>
                <span className="metric-note">{data.title}</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Compliance Score</span>
                <span className="metric-value">{kpis.compliance_score ?? "N/A"}</span>
                <span className="metric-note">Latest report KPI</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Timeline Tasks</span>
                <span className="metric-value">{activities.length}</span>
                <span className="metric-note">Implementation activities</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Missing Evidence</span>
                <span className="metric-value">{missingEvidence.length}</span>
                <span className="metric-note">Audit blockers</span>
              </div>
            </div>
          </section>

          <section className="enterprise-card wide">
            <h2>Implementation Timeline</h2>
            <div className="table-wrap">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Owner</th>
                    <th>Priority</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.length === 0 ? (
                    <tr><td colSpan="5">No implementation activities were generated.</td></tr>
                  ) : activities.slice(0, 12).map((item, index) => {
                    const numDeployed = deployedTasks.size;
                    let dynamicStatus = item.status;
                    let dynamicStyle = "neutral";
                    
                    if (numDeployed > 0) {
                      if (index < Math.min(numDeployed * 2, activities.length - 1)) {
                        dynamicStatus = "Completed";
                        dynamicStyle = "success";
                      } else if (index === Math.min(numDeployed * 2, activities.length - 1)) {
                        dynamicStatus = "In Progress";
                        dynamicStyle = "warning";
                      } else {
                        dynamicStatus = "Not Started";
                        dynamicStyle = "neutral";
                      }
                    }

                    return (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.owner}</td>
                        <td><span className={`status-chip ${String(item.priority).toLowerCase()}`}>{item.priority}</span></td>
                        <td>{item.end_date}</td>
                        <td><span className={`status-chip ${dynamicStyle}`}>{dynamicStatus}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="enterprise-card">
            <h2>Audit Summary</h2>
            <p>{reportData.audit_summary || data.summary || "Audit summary will appear after analysis."}</p>
            <div className="split-list" style={{ marginTop: 16 }}>
              {(data.recommendations || []).slice(0, 4).map((item) => (
                <div className="list-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.recommendation}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="enterprise-card full">
            <h2>Missing Evidence</h2>
            <div className="table-wrap">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Obligation</th>
                    <th>Status</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {missingEvidence.length === 0 ? (
                    <tr><td colSpan="3">No missing evidence was detected.</td></tr>
                  ) : missingEvidence.map((item) => (
                    <tr key={item.id}>
                      <td>{item.obligation}</td>
                      <td><span className={`status-chip ${String(item.status).toLowerCase()}`}>{item.status}</span></td>
                      <td>{item.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}
