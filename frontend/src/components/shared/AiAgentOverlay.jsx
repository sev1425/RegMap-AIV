import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, BrainCircuit } from "lucide-react";

export default function AiAgentOverlay({ task, onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    `Initializing AI Resolution Agent for ${task?.id || 'Tasks'}...`,
    `Analyzing Requirement: ${task ? task.requirement?.substring(0, 40) : 'Multiple Obligations'}...`,
    `Autonomously generating missing controls for ${task ? (task.department || 'all departments') : 'all departments'}...`,
    `Validating against Evidence: ${task ? (task.evidence || 'required artifacts') : 'required artifacts'}...`,
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
