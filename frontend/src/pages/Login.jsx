import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, User, ArrowRight, Lock } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';

const roles = [
  {
    id: 'Administrator',
    icon: Shield,
    desc: 'Full platform access — analysis, deployment, all agents',
    color: '#6366f1',
    tag: 'FULL ACCESS',
  },
  {
    id: 'Compliance Officer',
    icon: ShieldCheck,
    desc: 'Upload circulars, manage MAPs, review obligations',
    color: '#10b981',
    tag: 'CORE WORKFLOW',
  },
  {
    id: 'Auditor',
    icon: ShieldAlert,
    desc: 'Audit trail, evidence review, reporting only',
    color: '#f59e0b',
    tag: 'READ + AUDIT',
  },
  {
    id: 'Viewer',
    icon: User,
    desc: 'Dashboard and analytics — read only',
    color: '#94a3b8',
    tag: 'READ ONLY',
  },
];

export default function Login() {
  const { login } = useGlobalContext();
  const [selected, setSelected] = useState(null);
  const [entering, setEntering] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selected || entering) return;
    setEntering(true);
    await new Promise(r => setTimeout(r, 600));
    login(selected);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: '#060c1a',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99,102,241,0.06) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        borderRight: '1px solid rgba(99,102,241,0.12)',
        position: 'relative',
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(99,102,241,0.4)',
            }}>
              <Shield size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                RegMap AI
              </div>
              <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Enterprise Edition
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Agentic Regulatory Intelligence
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 20 }}>
            Turn regulatory<br />chaos into<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              automated compliance.
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, maxWidth: 400 }}>
            17-stage AI pipeline converts any RBI, SEBI, MCA or IBA circular into
            Measurable Action Points — with department routing, deadlines, evidence,
            and penalty exposure. Fully offline. Fully auditable.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
            {[
              { num: '<4s',  label: 'Processing Time' },
              { num: '83',   label: 'Obligations / Doc' },
              { num: '100%', label: 'Offline Capable' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px 0', borderTop: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>{s.num}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — login */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        flexShrink: 0,
      }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%' }}
        >
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Lock size={14} color="#64748b" />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Secure Access
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
              Select your role
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
              Access is scoped to your compliance responsibilities.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {roles.map((role, i) => {
                const Icon = role.icon;
                const isSelected = selected === role.id;
                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    onClick={() => setSelected(role.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: `1px solid ${isSelected ? role.color : 'rgba(99,102,241,0.12)'}`,
                      background: isSelected ? `rgba(${role.color === '#6366f1' ? '99,102,241' : role.color === '#10b981' ? '16,185,129' : role.color === '#f59e0b' ? '245,158,11' : '148,163,184'},0.08)` : 'rgba(13,22,39,0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? `0 0 0 1px ${role.color}40, 0 4px 16px ${role.color}20` : 'none',
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                      background: `rgba(${role.color === '#6366f1' ? '99,102,241' : role.color === '#10b981' ? '16,185,129' : role.color === '#f59e0b' ? '245,158,11' : '148,163,184'},0.15)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} color={role.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{role.id}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                          color: role.color, padding: '1px 6px', borderRadius: 3,
                          background: `rgba(${role.color === '#6366f1' ? '99,102,241' : role.color === '#10b981' ? '16,185,129' : role.color === '#f59e0b' ? '245,158,11' : '148,163,184'},0.12)`,
                          border: `1px solid ${role.color}40`,
                        }}>{role.tag}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{role.desc}</p>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? role.color : 'rgba(99,102,241,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: role.color }} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.button
              type="submit"
              disabled={!selected || entering}
              whileHover={selected && !entering ? { scale: 1.01 } : {}}
              whileTap={selected && !entering ? { scale: 0.99 } : {}}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 10,
                background: selected && !entering
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(13,22,39,0.8)',
                color: selected ? '#fff' : '#475569',
                fontWeight: 700,
                border: `1px solid ${selected ? 'transparent' : 'rgba(99,102,241,0.12)'}`,
                cursor: selected && !entering ? 'pointer' : 'not-allowed',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'inherit',
                boxShadow: selected && !entering ? '0 4px 24px rgba(99,102,241,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <AnimatePresence mode="wait">
                {entering ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Entering workspace...
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selected ? `Enter as ${selected}` : 'Select a role to continue'}
                    {selected && <ArrowRight size={16} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>🔒 Offline</span>
              No data leaves your machine. All AI processing happens locally after one-time model download.
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
