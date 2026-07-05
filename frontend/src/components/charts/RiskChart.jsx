import "./Charts.css";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

const COLORS = ["#DC2626", "#F97316", "#FACC15", "#22C55E"];

export default function RiskChart({ data }) {
  if (!data) return null;

  // Use the legacy risk_distribution or build it from priority_breakdown or risks
  const risks = data.risks || [];
  const riskDist = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  
  risks.forEach(r => {
      const sev = r.severity === 'Critical' ? 'Critical' : 
                 r.severity === 'High' ? 'High' : 
                 r.severity === 'Low' ? 'Low' : 'Medium';
      riskDist[sev] = (riskDist[sev] || 0) + 1;
  });

  const chartData = [
    { name: "Critical", value: riskDist.Critical },
    { name: "High", value: riskDist.High },
    { name: "Medium", value: riskDist.Medium },
    { name: "Low", value: riskDist.Low }
  ].filter(d => d.value > 0);

  // Fallback if no risks
  if (chartData.length === 0) {
      chartData.push({ name: "Low", value: 1 });
  }

  return (
    <div className="dashboard-card">
      <div className="chart-header">
        <div>
          <h3 className="card-title">Risk Distribution</h3>
          <p className="chart-subtitle">Enterprise compliance risks</p>
        </div>
        <div className="chart-badge">
          {risks.length} Risks
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
            >
              {chartData.map((entry, index) => {
                let color = COLORS[3]; // default Low
                if (entry.name === 'Critical') color = COLORS[0];
                if (entry.name === 'High') color = COLORS[1];
                if (entry.name === 'Medium') color = COLORS[2];
                return <Cell key={index} fill={color} />;
              })}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <div>
          <span className="footer-title">Critical</span>
          <h4>{riskDist.Critical}</h4>
        </div>
        <div>
          <span className="footer-title">High</span>
          <h4>{riskDist.High}</h4>
        </div>
        <div>
          <span className="footer-title">Medium</span>
          <h4>{riskDist.Medium}</h4>
        </div>
        <div>
          <span className="footer-title">Low</span>
          <h4>{riskDist.Low}</h4>
        </div>
      </div>
    </div>
  );
}