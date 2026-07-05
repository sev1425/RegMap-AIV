import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileUp, RefreshCw, ShieldCheck } from "lucide-react";
import { useEvidence } from "../hooks/useEvidence";
import "./EnterprisePages.css";

export default function EvidenceValidator() {
  const { data, result, loading, validating, error, refresh, validate } = useEvidence();
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const currentEvidence = data?.evidence || [];
  const missingEvidence = data?.missing_evidence || [];

  if (loading) {
    return (
      <div className="state-panel">
        <div className="enterprise-spinner" />
        <h2>Loading evidence register</h2>
        <p>RegMap is checking mapped evidence and missing compliance artifacts.</p>
      </div>
    );
  }

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header">
        <div>
          <h1>Evidence Validator</h1>
          <p>Upload supporting artifacts and validate them against extracted regulatory obligations.</p>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-button" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="enterprise-button primary" onClick={() => inputRef.current?.click()}>
            <FileUp size={16} /> Select Evidence
          </button>
        </div>
      </div>

      {error && (
        <div className="state-panel">
          <h3>Evidence validation error</h3>
          <p>{error}</p>
        </div>
      )}

      {!data && !error && (
        <div className="state-panel">
          <ShieldCheck size={28} />
          <h3>No analysis available</h3>
          <p>Upload and analyze a regulation before validating supporting evidence.</p>
        </div>
      )}

      {data && (
        <div className="enterprise-grid">
          <section className="enterprise-card full">
            <div className="metric-row">
              <div className="metric-tile">
                <span className="metric-label">Readiness</span>
                <span className="metric-value">{data.readiness_score}%</span>
                <span className="metric-note">Evidence-backed readiness</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Evidence Items</span>
                <span className="metric-value">{currentEvidence.length}</span>
                <span className="metric-note">Mapped by AI</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Missing</span>
                <span className="metric-value">{missingEvidence.length}</span>
                <span className="metric-note">Open evidence gaps</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Recommendation</span>
                <span className={`status-chip ${String(data.approval_recommendation).toLowerCase().split(" ")[0]}`}>
                  {data.approval_recommendation}
                </span>
                <span className="metric-note">Current approval posture</span>
              </div>
            </div>
          </section>

          <section className="enterprise-card">
            <h2>Evidence Upload</h2>
            <p>Supported formats: PDF, DOCX, PPTX, PNG, JPG, and TXT.</p>
            <div className="field-stack" style={{ marginTop: 16 }}>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.txt"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              {file && <p>{file.name}</p>}
              <button className="enterprise-button primary" disabled={!file || validating} onClick={() => validate(file)}>
                <CheckCircle2 size={16} /> {validating ? "Validating" : "Validate Evidence"}
              </button>
            </div>
          </section>

          <section className="enterprise-card wide">
            <h2>Validation Result</h2>
            {!result ? (
              <p>Select an evidence file to calculate confidence, detect missing proof, and generate an approval recommendation.</p>
            ) : (
              <div className="split-list">
                <div className="metric-row">
                  <div className="metric-tile">
                    <span className="metric-label">Confidence</span>
                    <span className="metric-value">{result.confidence}%</span>
                    <span className="metric-note">{result.filename}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Missing Evidence</span>
                    <span className="metric-value">{result.missing_evidence?.length || 0}</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Decision</span>
                    <span className={`status-chip ${String(result.approval_recommendation).toLowerCase().split(" ")[0]}`}>
                      {result.approval_recommendation}
                    </span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-label">Extracted Text</span>
                    <span className="metric-value">{result.extracted_characters}</span>
                    <span className="metric-note">Characters</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="enterprise-card full">
            <h2>Evidence Register</h2>
            <div className="table-wrap">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Obligation</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvidence.length === 0 ? (
                    <tr><td colSpan="4">No evidence records were generated for the latest analysis.</td></tr>
                  ) : currentEvidence.map((item) => (
                    <tr key={item.id}>
                      <td>{item.obligation}</td>
                      <td><span className={`status-chip ${String(item.status).toLowerCase()}`}>{item.status}</span></td>
                      <td>{item.confidence}%</td>
                      <td>{item.source}</td>
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
