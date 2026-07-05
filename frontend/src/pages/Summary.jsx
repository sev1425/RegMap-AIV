import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Gauge, ShieldAlert, RefreshCw, Activity, CheckCircle, Clock, AlertTriangle, Building, Lightbulb } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import "./EnterprisePages.css";

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;
  if (secondsPast < 60) return 'Just now';
  if (secondsPast < 3600) return Math.floor(secondsPast / 60) + 'm ago';
  if (secondsPast <= 86400) return Math.floor(secondsPast / 3600) + 'h ago';
  return Math.floor(secondsPast / 86400) + 'd ago';
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function ExecutiveSummaryPage({ setActivePage }) {
  const { data, loading, error, refresh } = useDashboard();

  const snapshot = useMemo(() => {
    const d = data || {};
    const kpis = d.kpis || d; 
    const complianceScore = safeNumber(kpis.compliance_score ?? kpis.complianceScore, 0);

    const highRisks = safeNumber(kpis.high_risks ?? kpis.highRisks, 0);
    const totalObligations = safeNumber(kpis.total_obligations ?? kpis.obligations_total ?? kpis.totalObligations, d.obligations?.length || 0);

    let readiness = safeNumber(d.readiness_score ?? kpis.readiness_score ?? kpis.readiness, 0);
    
    // Recalculate readiness based on tasks
    let completedTasks = 0;
    let totalTasks = 0;
    if (d.workflow) {
      completedTasks = (d.workflow.completed_tasks || []).length;
      totalTasks = totalObligations || completedTasks; // Base tasks on obligations
      if (totalTasks > 0) {
        readiness = Math.round((completedTasks / totalTasks) * 100);
      }
    }

    const activityFeed = (d.workflow?.deployment_history || []).slice(-5).reverse();

    // Top 5 risks
    const topRisks = (d.risks || [])
      .filter(r => r.severity === 'High' || r.severity === 'Critical')
      .slice(0, 5)
      .map((r, i) => ({
        id: r.id || `RSK-${i + 1}`,
        description: r.description || r.source || 'Unspecified risk',
        severity: r.severity || 'High',
        department: r.department || 'General',
      }));

    // Departments needing attention
    const departments = (d.departments || []).slice(0, 5).map(dept => ({
      name: dept.name || dept.department || 'Unknown',
      impact: dept.impact || dept.responsibilities || 'Review required',
    }));

    // AI Recommendations
    const recommendations = (d.recommendations || []).slice(0, 4).map(r => ({
      action: r.action || r.description || 'Implement compliance controls',
      priority: r.priority || 'Medium',
    }));

    // Upcoming deadlines
    const deadlines = (d.deadlines || d.implementation_timeline || []).slice(0, 3).map(dl => ({
      date: dl.date || dl.deadline || dl.date_expression || 'TBD',
      task: dl.event || dl.task || dl.text || 'Compliance deadline',
    }));

    return {
      complianceScore,
      highRisks,
      totalObligations,
      readiness,
      completedTasks,
      title: d.title || d.company || "Executive Decision Center",
      activityFeed,
      topRisks,
      departments,
      recommendations,
      deadlines,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="enterprise-page flex-center">
        <div className="glass-panel" style={{ padding: "60px", textAlign: "center", maxWidth: 760 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            style={{ margin: "0 auto 24px" }}
          >
            <Gauge size={64} color="var(--accent-primary)" />
          </motion.div>
          <h2 className="h2" style={{ marginBottom: 10 }}>
            Generating Executive Briefing
          </h2>
          <p className="body">RegMap AI is compiling compliance score, risks, and readiness from the latest analysis.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enterprise-page flex-center">
        <div className="glass-panel flex-center flex-column error-state" style={{ padding: 40, maxWidth: 720, width: "100%" }}>
          <ShieldAlert size={56} color="var(--danger)" style={{ marginBottom: 16 }} />
          <h2 className="h2" style={{ marginBottom: 8 }}>
            Executive Briefing Unavailable
          </h2>
          <p className="body" style={{ marginBottom: 20 }}>
            {error}
          </p>
          <button className="btn btn-primary" onClick={refresh}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="enterprise-page flex-center">
        <div className="glass-panel" style={{ padding: "60px", textAlign: "center", maxWidth: 760 }}>
          <FileText size={64} color="var(--text-tertiary)" style={{ margin: "0 auto 24px" }} />
          <h2 className="h2" style={{ marginBottom: 10 }}>
            No Executive Briefing Yet
          </h2>
          <p className="body">Upload and analyze a regulation document to generate your enterprise executive briefing.</p>
          <button className="btn btn-primary" onClick={() => setActivePage?.("Regulations")}>
            Go to Regulations
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header" style={{ marginBottom: 18 }}>
        <div>
          <h1>Executive Briefing</h1>
          <p>Board-ready compliance snapshot: score, readiness, risk intensity, and live task resolution.</p>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-button" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="enterprise-grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
        <section className="enterprise-card full" style={{ gridColumn: "span 12" }}>
          <div className="metric-row" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div className="metric-tile">
              <span className="metric-label">Compliance Score</span>
              <span className="metric-value">{snapshot.complianceScore}</span>
              <span className="metric-note">{snapshot.title}</span>
            </div>
            <div className="metric-tile">
              <span className="metric-label">High Risks</span>
              <span className="metric-value" style={{ color: "var(--danger)" }}>
                {snapshot.highRisks}
              </span>
              <span className="metric-note">Immediate attention</span>
            </div>
            <div className="metric-tile">
              <span className="metric-label">Obligations Detected</span>
              <span className="metric-value">{snapshot.totalObligations}</span>
              <span className="metric-note">Mapped to departments</span>
            </div>
            <div className="metric-tile">
              <span className="metric-label">Compliance Readiness</span>
              <span className="metric-value" style={{ color: snapshot.readiness > 80 ? "var(--success)" : "var(--warning)" }}>
                {snapshot.readiness}%
              </span>
              <span className="metric-note">{snapshot.completedTasks} / {snapshot.totalObligations} Tasks Completed</span>
            </div>
          </div>
        </section>

        <section className="enterprise-card wide" style={{ gridColumn: "span 7" }}>
          <h2>Executive Interpretation</h2>
          <p className="body" style={{ lineHeight: 1.85 }}>
            RegMap AI has analyzed the uploaded regulatory document(s) and produced an enterprise compliance posture.
            Use the dashboard KPIs, timeline, and recommendations to prioritize department-level remediation.
          </p>
          <div style={{ marginTop: 14 }} className="glass-panel" aria-hidden="true">
            <p className="caption" style={{ marginBottom: 8 }}>
              Compliance posture signals
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }} className="body">
              <li>Higher compliance score indicates stronger alignment to obligations.</li>
              <li>High risks flag departments requiring expedited evidence and mitigation planning.</li>
              <li>Readiness reflects evidence coverage, task completion, and audit preparedness.</li>
            </ul>
          </div>
        </section>

        <section className="enterprise-card" style={{ gridColumn: "span 5", display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Activity Feed</h2>
            <Activity size={18} color="var(--text-tertiary)" />
          </div>
          <div className="activity-feed" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {snapshot.activityFeed.length === 0 ? (
              <div className="body" style={{ color: "var(--text-tertiary)", textAlign: "center", marginTop: 24 }}>
                No recent activity. Generate and deploy tasks to see updates here.
              </div>
            ) : (
              snapshot.activityFeed.map((activity, idx) => {
                let dateStr = "Just now";
                try {
                  dateStr = timeAgo(activity.timestamp);
                } catch(e) {}
                
                return (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ padding: 6, borderRadius: '50%', backgroundColor: 'var(--success-subtle)', color: 'var(--success)' }}>
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <div className="body" style={{ fontWeight: 500, marginBottom: 4 }}>{activity.action}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <span>{activity.task_id}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <button className="enterprise-button" onClick={() => setActivePage?.("Task Generator")}>
              View Tasks
            </button>
            <button className="enterprise-button" onClick={() => setActivePage?.("AI Copilot")}>
              Ask Copilot
            </button>
          </div>
        </section>

        {/* Top 5 Risks */}
        <section className="enterprise-card" style={{ gridColumn: "span 6" }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Top Risks</h2>
            <AlertTriangle size={18} color="var(--danger)" />
          </div>
          {snapshot.topRisks.length === 0 ? (
            <div className="body" style={{ color: "var(--text-tertiary)" }}>No high-risk findings.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {snapshot.topRisks.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--danger)', minWidth: 56 }}>{r.id}</span>
                  <span className="body" style={{ flex: 1, fontSize: '0.82rem' }}>{r.description.substring(0, 80)}{r.description.length > 80 ? '…' : ''}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{r.department}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Departments Needing Attention */}
        <section className="enterprise-card" style={{ gridColumn: "span 6" }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Departments</h2>
            <Building size={18} color="var(--text-tertiary)" />
          </div>
          {snapshot.departments.length === 0 ? (
            <div className="body" style={{ color: "var(--text-tertiary)" }}>No department data available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {snapshot.departments.map((d, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>{d.name}</div>
                  <div className="body" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.impact.substring(0, 90)}{d.impact.length > 90 ? '…' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Recommendations */}
        <section className="enterprise-card" style={{ gridColumn: "span 7" }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>AI Recommendations</h2>
            <Lightbulb size={18} color="var(--warning)" />
          </div>
          {snapshot.recommendations.length === 0 ? (
            <div className="body" style={{ color: "var(--text-tertiary)" }}>No recommendations generated.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {snapshot.recommendations.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4,
                    backgroundColor: r.priority === 'High' ? 'rgba(220,38,38,0.12)' : 'rgba(245,158,11,0.12)',
                    color: r.priority === 'High' ? 'var(--danger)' : 'var(--warning)' }}>
                    {r.priority}
                  </span>
                  <span className="body" style={{ flex: 1, fontSize: '0.82rem' }}>{r.action}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Deadlines */}
        <section className="enterprise-card" style={{ gridColumn: "span 5" }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Upcoming Deadlines</h2>
            <Clock size={18} color="var(--text-tertiary)" />
          </div>
          {snapshot.deadlines.length === 0 ? (
            <div className="body" style={{ color: "var(--text-tertiary)" }}>No deadlines found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {snapshot.deadlines.map((dl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                  <Clock size={14} color="var(--warning)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{dl.date}</div>
                    <div className="body" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{dl.task.substring(0, 60)}{dl.task.length > 60 ? '…' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <button className="enterprise-button" onClick={() => setActivePage?.("Compliance Calendar")}>
              Open Calendar
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
