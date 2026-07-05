import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { useAnalytics } from "../hooks/useAnalytics";
import "./EnterprisePages.css";

const RISK_COLORS = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#16a34a",
  Critical: "#991b1b"
};

export default function Analytics() {
  const { data, loading, error, refresh } = useAnalytics();

  if (loading) {
    return (
      <div className="state-panel">
        <div className="enterprise-spinner" />
        <h2>Loading analytics</h2>
        <p>RegMap is preparing risk trends, heatmaps, compliance KPIs, and department views.</p>
      </div>
    );
  }

  if (!data && !error) {
    return (
      <div className="state-panel">
        <h2>No analytics available</h2>
        <p>Upload and analyze a regulation before reviewing compliance analytics.</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const riskTrend = data?.risk_trend || [];
  const priorityBreakdown = Object.entries(data?.priority_breakdown || {}).map(([name, value]) => ({ name, value }));
  const departmentScores = Object.entries(data?.department_risk || {}).map(([department, risks]) => ({
    department,
    score: Math.max(0, 100 - ((risks.High || 0) * 12 + (risks.Medium || 0) * 6 + (risks.Low || 0) * 2)),
    high: risks.High || 0,
    medium: risks.Medium || 0,
    low: risks.Low || 0
  }));

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header">
        <div>
          <h1>Analytics</h1>
          <p>Interactive compliance trends, risk distribution, department heatmaps, and export-ready intelligence.</p>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-button" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="enterprise-button">
            <Download size={16} /> Export View
          </button>
        </div>
      </div>

      {error && (
        <div className="state-panel">
          <h3>Analytics error</h3>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="enterprise-grid">
          <section className="enterprise-card full">
            <div className="metric-row">
              <div className="metric-tile">
                <span className="metric-label">Compliance Score</span>
                <span className="metric-value">{kpis.compliance_score ?? 0}</span>
                <span className="metric-note">{data.title}</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">High Risks</span>
                <span className="metric-value">{kpis.high_risks ?? 0}</span>
                <span className="metric-note">Immediate action</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Obligations</span>
                <span className="metric-value">{kpis.total_obligations ?? 0}</span>
                <span className="metric-note">{kpis.mandatory_obligations ?? 0} mandatory</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Readiness</span>
                <span className="metric-value">{data.readiness_score ?? 0}%</span>
                <span className="metric-note">Evidence backed</span>
              </div>
            </div>
          </section>

          <section className="enterprise-card wide">
            <h2>Compliance Trend</h2>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskTrend}>
                  <defs>
                    <linearGradient id="analyticsTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fill="url(#analyticsTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="enterprise-card">
            <h2>Priority Distribution</h2>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityBreakdown} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96}>
                    {priorityBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="enterprise-card wide">
            <h2>Department Trends</h2>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="enterprise-card">
            <h2>Risk Heatmap</h2>
            <div className="heatmap-grid">
              {departmentScores.length === 0 ? (
                <p>No department risk distribution available.</p>
              ) : departmentScores.map((item) => {
                const intensity = Math.min(0.95, 0.12 + item.high * 0.22 + item.medium * 0.12);
                return (
                  <div
                    className="heatmap-cell"
                    key={item.department}
                    style={{ background: `rgba(220, 38, 38, ${intensity})` }}
                  >
                    <strong>{item.department}</strong>
                    <span>High {item.high}</span>
                    <span>Medium {item.medium}</span>
                    <span>Low {item.low}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}
