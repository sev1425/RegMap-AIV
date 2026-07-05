import { useMemo, useState, useCallback } from "react";
import { Zap } from "lucide-react";
import { useGlobalContext } from "../../context/GlobalContext";
import "./DeadlineList.css";

export default function DeadlineList({ data }) {
  if (!data) return null;
  const deadlines = data.deadlines || [];

  const { deployTasksBulk } = useGlobalContext();
  const [isSolving, setIsSolving] = useState(false);

  const getUrgencyColor = (status) => {
    if (status === "Overdue") return "var(--danger)";
    if (status === "Urgent") return "var(--warning)";
    return "var(--success)";
  };

  const urgentDeadlines = useMemo(() => {
    return deadlines
      .filter((d) => {
        const daysLeft = d?.days_remaining;
        const status = d?.status;
        const isUrgent = status === "Urgent" || status === "Overdue";
        const isSoon = typeof daysLeft === "number" && daysLeft <= 2;
        return isUrgent || isSoon;
      })
      .slice(0, 5);
  }, [deadlines]);

  const deadlineToTaskId = useCallback((deadline, index) => {
    return (
      deadline?.task_id ||
      deadline?.obligation_id ||
      deadline?.linked_obligation_id ||
      deadline?.id ||
      `DDL-AIV-${index}`
    );
  }, []);

  const handleSolveUrgent = useCallback(() => {
    if (isSolving) return;
    const tasks = urgentDeadlines.map((d, i) => deadlineToTaskId(d, i));
    if (!tasks.length) return;

    setIsSolving(true);
    // UI overlay in ObligationList is timer-based; for DeadlineList we just mark deployed immediately.
    deployTasksBulk(tasks);
    setTimeout(() => setIsSolving(false), 1200);
  }, [deployTasksBulk, deadlineToTaskId, isSolving, urgentDeadlines]);

  return (
    <div className="dashboard-card">
      <div className="deadline-header">
        <div>
          <h3 className="card-title">Upcoming Deadlines</h3>
          <p>Compliance actions requiring attention</p>
        </div>
        <div className="deadline-header-right">
          <button
            className="enterprise-button"
            onClick={handleSolveUrgent}
            disabled={!urgentDeadlines.length || isSolving}
            style={{ opacity: !urgentDeadlines.length || isSolving ? 0.6 : 1 }}
            title={!urgentDeadlines.length ? "No urgent deadlines" : "Deploy urgent work"}
          >
            <Zap size={16} /> {isSolving ? "Resolving..." : "Solve urgent pending"}
          </button>
        </div>
      </div>

      <div className="deadline-list">
        {deadlines.length > 0 ? (
          deadlines.slice(0, 5).map((item, index) => {
            const daysLeft = item.days_remaining ?? "—";
            const status = item.status || "Pending";
            const urgencyColor = getUrgencyColor(status);
            const isUrgent = urgentDeadlines.some((u) => u === item);

            return (
              <div className="deadline-item" key={index}>
                <div className="deadline-info">
                  <h4>{item.deadline_text || "Complete regulatory activity"}</h4>
                  <span style={{ color: urgencyColor, fontWeight: 600 }}>
                    {typeof daysLeft === "number" ? `${daysLeft} days remaining` : daysLeft}
                  </span>
                </div>
                <div className="deadline-right">
                  <div
                    className={`priority ${status === "Overdue" ? "critical" : status === "Urgent" ? "high" : "medium"}`}
                  >
                    {status}
                  </div>
                  <small>{item.date_expression || item.deadline || "No date"}</small>
                  {isUrgent && (
                    <button
                      onClick={handleSolveUrgent}
                      className="deadline-solve-inline"
                      disabled={isSolving}
                      style={{ marginTop: 8 }}
                    >
                      <Zap size={12} /> AI Solve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">No upcoming deadlines found.</div>
        )}
      </div>
    </div>
  );
}


