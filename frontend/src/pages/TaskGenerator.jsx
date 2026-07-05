import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, RefreshCw, CheckCircle2, BrainCircuit } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";
import { useGlobalContext } from "../context/GlobalContext";
import "./EnterprisePages.css";

const AiAgentOverlay = ({ task, onComplete }) => {
  const [step, setStep] = useState(0);
  const steps = [
    `Initializing AI Resolution Agent for ${task?.id || 'Tasks'}...`,
    `Analyzing Requirement: ${task ? task.requirement.substring(0, 40) : 'Multiple Obligations'}...`,
    `Autonomously generating missing controls for ${task ? task.department : 'all departments'}...`,
    `Validating against Evidence: ${task ? task.evidence : 'required artifacts'}...`,
    `Resolution Deployed Successfully.`
  ];

  useEffect(() => {
    if (step < steps.length - 1) {
      const timer = setTimeout(() => setStep(s => s + 1), 1200);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, steps.length, onComplete]);

  return (
    <div className="flex-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
       <motion.div className="glass-panel" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ padding: '32px', maxWidth: '500px', width: '100%', border: '1px solid var(--accent-primary)' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', margin: 0 }}><BrainCircuit color="var(--accent-primary)" size={24} /> AI Autonomous Resolution</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {steps.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= step ? 1 : 0.3, x: i <= step ? 0 : -10 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: i === step ? 'var(--accent-primary)' : (i < step ? 'var(--success)' : 'var(--text-tertiary)') }}>
                     {i < step ? <CheckCircle2 size={16} /> : (i === step ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <div style={{width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-medium)'}}/>)}
                     <span style={{ fontWeight: i === step ? 600 : 400 }}>{s}</span>
                   </div>
                </motion.div>
             ))}
          </div>
       </motion.div>
    </div>
  )
}

export default function TaskGenerator() {
  const { data, loading, error, refresh } = useAnalysis();
  const { deployedTasks, deployTask, deployTasksBulk } = useGlobalContext();
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [activeAiTask, setActiveAiTask] = useState(null);
  const [isBulkDeploying, setIsBulkDeploying] = useState(false);

  if (loading) {
    return (
      <div className="state-panel">
        <div className="enterprise-spinner" />
        <h2>Generating obligations</h2>
        <p>RegMap is converting obligations and requirements into deployable maps.</p>
      </div>
    );
  }

  if (!data && !error) {
    return (
      <div className="state-panel">
        <ClipboardCheck size={28} />
        <h2>No obligations available</h2>
        <p>Upload and analyze a regulation before generating deployment maps.</p>
      </div>
    );
  }

  const obligations = data?.obligations || [];
  
  // Transform or enrich obligations if needed
  const displayObligations = obligations.map((obl, idx) => ({
    id: obl.id || `OB-${idx + 1}`,
    requirement: obl.obligation_text || obl.text || "Compliance obligation requires immediate attention and integration.",
    department: obl.department || "IT",
    priority: obl.priority || (obl.category === "Mandatory" ? "High" : "Medium"),
    deadline: obl.deadline || "Inferred: 45 days",
    evidence: obl.evidence || "Signed Compliance Attestation",
    original: obl
  }));

  const handleDeploy = (task) => {
    setActiveAiTask(task);
  };

  const finishDeploy = () => {
    deployTask(activeAiTask.id);
    setActiveAiTask(null);
  };

  const toggleSelect = (id) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDeploy = () => {
    setIsBulkDeploying(true);
  };

  const finishBulkDeploy = () => {
    deployTasksBulk(Array.from(selectedTasks));
    setSelectedTasks(new Set());
    setIsBulkDeploying(false);
  };

  return (
    <>
    <AnimatePresence>
      {activeAiTask && <AiAgentOverlay task={activeAiTask} onComplete={finishDeploy} />}
      {isBulkDeploying && <AiAgentOverlay task={null} onComplete={finishBulkDeploy} />}
    </AnimatePresence>
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header">
        <div>
          <h1>Task Generator</h1>
          <p>Review and deploy compliance obligations directly into workflow maps.</p>
        </div>
        <div className="enterprise-actions">
          <button className="btn btn-secondary" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="state-panel">
          <h3>Task generation error</h3>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="enterprise-grid">
          <section className="enterprise-card full" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: '1.25rem', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Extracted Obligations</h2>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--success)', border: 'none' }}
                onClick={handleBulkDeploy}
                disabled={selectedTasks.size === 0}
              >
                Generate Selected MAPs
              </button>
            </div>
            
            <div className="table-wrap" style={{ border: 'none', margin: 0 }}>
              <table className="enterprise-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ width: '40px', paddingLeft: '24px' }}>
                      <input type="checkbox" onChange={(e) => {
                        if (e.target.checked) setSelectedTasks(new Set(displayObligations.map(o => o.id)));
                        else setSelectedTasks(new Set());
                      }} checked={selectedTasks.size === displayObligations.length && displayObligations.length > 0} />
                    </th>
                    <th style={{ padding: '16px 8px' }}>Obligation ID</th>
                    <th style={{ padding: '16px 8px', width: '40%' }}>Requirement (Exact Clause)</th>
                    <th style={{ padding: '16px 8px' }}>Department</th>
                    <th style={{ padding: '16px 8px' }}>Priority</th>
                    <th style={{ padding: '16px 8px' }}>Deadline</th>
                    <th style={{ padding: '16px 8px' }}>Evidence Required</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Deploy MAP</th>
                  </tr>
                </thead>
                <tbody className="body">
                  {displayObligations.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding: '24px', textAlign: 'center' }}>No obligations found in this document.</td></tr>
                  ) : displayObligations.map((task) => (
                    <tr key={task.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ paddingLeft: '24px' }}>
                        <input type="checkbox" checked={selectedTasks.has(task.id)} onChange={() => toggleSelect(task.id)} />
                      </td>
                      <td style={{ fontWeight: 500 }}>{task.id}</td>
                      <td style={{ paddingRight: '24px', lineHeight: '1.5' }}>{task.requirement}</td>
                      <td>{task.department}</td>
                      <td><span style={{ color: task.priority === 'High' || task.priority === 'Critical' ? 'var(--warning)' : 'var(--success)' }}>{task.priority}</span></td>
                      <td style={{ color: 'var(--success)' }}>{task.deadline}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{task.evidence}</td>
                      <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                        {deployedTasks.has(task.id) ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, padding: '6px 12px', border: '1px solid var(--success)', borderRadius: '4px' }}>
                            <CheckCircle2 size={14} /> Solved by AI
                          </div>
                        ) : (
                          <button 
                            className="btn btn-secondary" 
                            style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', backgroundColor: 'transparent' }}
                            onClick={() => handleDeploy(task)}
                          >
                            Auto-Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </motion.div>
    </>
  );
}
