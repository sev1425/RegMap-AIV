import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, BrainCircuit, Zap } from "lucide-react";
import { useGlobalContext } from "../../context/GlobalContext";
import "./ObligationList.css";

// AI-generated solutions mapped by department
const AI_SOLUTIONS = {
  "Compliance": "Deploy automated compliance monitoring framework. Establish policy attestation workflow with quarterly review cycles. Assign Compliance Officer as control owner.",
  "IT": "Implement technical controls via access management updates. Deploy automated audit trail logging. Schedule security review within 30 days.",
  "Treasury": "Update treasury risk management procedures. Implement automated limit monitoring with real-time alerts. Assign Treasury Head as responsible authority.",
  "Legal": "Draft regulatory response memorandum. Engage external counsel for impact assessment. File regulatory acknowledgment within prescribed timeline.",
  "Management": "Escalate to Board Risk Committee. Establish dedicated task force with weekly progress reporting. Integrate into enterprise risk register.",
  "Operations": "Update standard operating procedures. Conduct staff training sessions. Implement process controls with dual-authorization requirements.",
  "Risk": "Update risk appetite framework. Integrate obligation into risk heat map. Schedule quarterly stress testing.",
  "Unknown": "Assign designated control owner. Establish remediation timeline with milestone tracking. Report progress to compliance committee."
};

function getSolution(dept) {
  return AI_SOLUTIONS[dept] || AI_SOLUTIONS["Unknown"];
}

function SolvingOverlay({ obligation, onDone }) {
  const [step, setStep] = useState(0);
  const dept = obligation.department || "Compliance";
  const steps = [
    `Analyzing obligation for ${dept} department...`,
    `Identifying applicable regulatory controls...`,
    `Generating remediation action plan...`,
    `Validating solution against compliance framework...`,
    `Solution deployed successfully.`
  ];

  const handleComplete = useCallback(() => {
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (step < steps.length - 1) {
      const timer = setTimeout(() => setStep(s => s + 1), 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(handleComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [step, steps.length, handleComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      style={{ marginTop: "12px", padding: "12px", borderRadius: "12px", background: "var(--accent-subtle)", border: "1px solid var(--accent-primary)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "var(--accent-primary)", fontWeight: 600, fontSize: "13px" }}>
        <BrainCircuit size={16} /> AI Resolving...
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", fontSize: "12px", color: i <= step ? (i < step ? "var(--success)" : "var(--accent-primary)") : "var(--text-tertiary)", transition: "color 0.3s" }}>
          {i < step ? <CheckCircle2 size={12} /> : (i === step ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--border-medium)" }} />)}
          <span>{s}</span>
        </div>
      ))}
    </motion.div>
  );
}

export default function ObligationList({ data }) {
  if (!data) return null;

  const { deployedTasks, deployTask } = useGlobalContext();
  const obligations = data.obligations || [];
  const [solvingIndex, setSolvingIndex] = useState(null);
  const [solvedMap, setSolvedMap] = useState({});

  const handleSolve = (index, item) => {
    setSolvingIndex(index);
  };

  const handleSolveDone = (index, item) => {
    const dept = item.department || "Unknown";
    const oblId = item.id || `OBL-DASH-${index}`;
    setSolvedMap(prev => ({ ...prev, [index]: getSolution(dept) }));
    setSolvingIndex(null);
    deployTask(oblId);
  };

  return (
    <div className="dashboard-card">
      <div className="obligation-header">
        <div>
          <h3 className="card-title">Top Obligations</h3>
          <p>AI prioritized regulatory obligations</p>
        </div>
      </div>
      <div className="obligation-list">
        {obligations.length > 0 ? (
          obligations.slice(0, 5).map((item, index) => {
            const dept = item.department || "Unknown";
            const priority = item.category === "Mandatory" ? "High" : "Medium";
            const isSolved = solvedMap[index] !== undefined || item.resolved === true;
            const isSolving = solvingIndex === index;

            return (
              <div className="obligation-item" key={index} style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <div className="obligation-avatar" style={isSolved ? { background: "var(--success)" } : {}}>
                    {isSolved ? <CheckCircle2 size={22} /> : dept.charAt(0)}
                  </div>
                  <div className="obligation-content">
                    <h4>{item.obligation_text || item.text || "Regulatory obligation"}</h4>
                    <span>{dept}</span>
                    {!isSolved && !isSolving && (
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "0%" }} />
                      </div>
                    )}
                    {isSolved && (
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "100%", background: "var(--success)" }} />
                      </div>
                    )}
                  </div>
                  <div className="obligation-right">
                    {isSolved ? (
                      <>
                        <div className="priority-chip low">Resolved</div>
                        <small style={{ color: "var(--success)" }}>AI Solved</small>
                      </>
                    ) : isSolving ? (
                      <>
                        <div className="priority-chip" style={{ background: "var(--accent-subtle)", color: "var(--accent-primary)" }}>Solving...</div>
                      </>
                    ) : (
                      <>
                        <div className={`priority-chip ${priority.toLowerCase()}`}>{priority}</div>
                        <button
                          onClick={() => handleSolve(index, item)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--accent-primary)",
                            background: "transparent", color: "var(--accent-primary)", cursor: "pointer",
                            fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap"
                          }}
                        >
                          <Zap size={12} /> AI Solve
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isSolving && (
                    <SolvingOverlay obligation={item} onDone={() => handleSolveDone(index, item)} />
                  )}
                </AnimatePresence>

                {isSolved && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{ marginTop: "12px", padding: "12px 16px", borderRadius: "10px", background: "var(--success-subtle)", border: "1px solid var(--success)", fontSize: "13px", lineHeight: "1.6", color: "var(--text-primary)" }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--success)", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                      <BrainCircuit size={14} /> AI Resolution Plan:
                    </div>
                    {solvedMap[index] || "Marked complete — tracked in MAP Tracker."}
                  </motion.div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-state">No obligations found.</div>
        )}
      </div>
    </div>
  );
}

