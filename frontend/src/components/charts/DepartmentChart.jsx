import "./Charts.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";

const colors = [
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#BFDBFE"
];

export default function DepartmentChart({ data }) {
  if (!data) return null;

  const deptRisk = data.analytics?.department_risk || {};
  const chartData = Object.entries(deptRisk).map(([dept, risks]) => {
      // Calculate a simplistic performance score: base 100 - (High*10 + Medium*5 + Low*2)
      const penalty = (risks.High || 0) * 10 + (risks.Medium || 0) * 5 + (risks.Low || 0) * 2;
      return {
          department: dept,
          score: Math.max(0, 100 - penalty)
      };
  }).sort((a, b) => b.score - a.score).slice(0, 5); // top 5

  if (chartData.length === 0) {
      chartData.push({ department: "General", score: 100 });
  }

  const bestDept = chartData[0];
  const avgScore = chartData.reduce((acc, c) => acc + c.score, 0) / chartData.length;

  return (
    <div className="dashboard-card">
      <div className="chart-header">
        <div>
          <h3 className="card-title">Department Performance</h3>
          <p className="chart-subtitle">Compliance completion by department</p>
        </div>
        <div className="chart-badge">
          {Object.keys(deptRisk).length} Teams
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748B" }} />
            <YAxis
              type="category"
              dataKey="department"
              tick={{ fill: "#475569", fontSize: 13 }}
              width={90}
            />
            <Tooltip />
            <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={22}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <div>
          <span className="footer-title">Best Department</span>
          <h4>{bestDept.department}</h4>
        </div>
        <div>
          <span className="footer-title">Average Score</span>
          <h4>{Math.round(avgScore)}%</h4>
        </div>
        <div>
          <span className="footer-title">Departments</span>
          <h4>{Object.keys(deptRisk).length}</h4>
        </div>
      </div>
    </div>
  );
}