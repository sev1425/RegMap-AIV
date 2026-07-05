import "./Charts.css";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function ComplianceChart({ data }) {
  if (!data) return null;

  // Transform risk trend from analytics into something we can plot
  const trend = data.analytics?.risk_trend || [];
  const chartData = trend.map((t, i) => ({
    stage: `S${i + 1}`,
    score: t.score
  }));

  const complianceScore = data.compliance_score || 0;

  return (
    <div className="dashboard-card">
      <div className="chart-header">
        <div>
          <h3 className="card-title">Compliance Trend</h3>
          <p className="chart-subtitle">Enterprise compliance performance over analysis stages</p>
        </div>
        <div className="chart-badge">
          {complianceScore.toFixed(1)}%
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#edf2f7" />
            <XAxis dataKey="stage" tick={{ fill: "#64748b" }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748b" }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={4}
              fill="url(#complianceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <div>
          <span className="footer-title">Final Score</span>
          <h4>{complianceScore.toFixed(1)}%</h4>
        </div>
        <div>
          <span className="footer-title">Baseline</span>
          <h4>{trend.length > 0 ? trend[0].score : 100}%</h4>
        </div>
      </div>
    </div>
  );
}