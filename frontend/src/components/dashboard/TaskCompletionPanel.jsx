import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, ArrowRight, Sparkles } from "lucide-react";
import { useGlobalContext } from "../../context/GlobalContext";
import { fetchMAPs } from "../../api/mapsApi";
import "./TaskCompletionPanel.css";

export default function TaskCompletionPanel({ setActivePage }) {
  const { lastUpdated } = useGlobalContext();
  const [maps, setMaps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const load = useCallback(async () => {
    try {
      const res = await fetchMAPs();
      if (res.success) {
        setMaps(res.maps || []);
        setSummary(res.summary || null);
      }
    } catch (e) {
      // Silently fail — dashboard already shows a global error state elsewhere.
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever anything in the app triggers a global refresh
  // (upload completes, a MAP status changes, a task is AI auto-resolved).
  useEffect(() => { load(); }, [load, lastUpdated]);

  if (loading) {
    return (
      <div className="dashboard-card task-completion-card">
        <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />
      </div>
    );
  }

  if (!summary || maps.length === 0) return null;

  const done = maps.filter(m => m.status === "Complete");
  const pending = maps.filter(m => m.status !== "Complete");
  const list = (tab === "done" ? done : pending).slice(0, 5);
  const total = maps.length;
  const donePct = total > 0 ? Math.round((done.length / total) * 100) : 0;

  return (
    <div className="dashboard-card task-completion-card">
      <div className="tc-header">
        <div>
          <h3 className="card-title">Task Completion</h3>
          <p>Done vs pending MAPs, synced live across the platform</p>
        </div>
        <button
          className="tc-view-all"
          onClick={() => setActivePage?.("MAP Tracker")}
        >
          View all <ArrowRight size={13} />
        </button>
      </div>

      <div className="tc-progress-row">
        <div className="tc-progress-bar">
          <div className="tc-progress-fill" style={{ width: `${donePct}%` }} />
        </div>
        <span className="tc-progress-label">{donePct}% complete</span>
      </div>

      <div className="tc-tabs">
        <button
          className={`tc-tab ${tab === "pending" ? "active pending" : ""}`}
          onClick={() => setTab("pending")}
        >
          <Clock size={13} /> Pending <span className="tc-count">{pending.length}</span>
        </button>
        <button
          className={`tc-tab ${tab === "done" ? "active done" : ""}`}
          onClick={() => setTab("done")}
        >
          <CheckCircle2 size={13} /> Done <span className="tc-count">{done.length}</span>
        </button>
      </div>

      <div className="tc-list">
        {list.length === 0 ? (
          <div className="tc-empty">
            {tab === "done" ? "Nothing completed yet." : "Nothing pending — fully up to date."}
          </div>
        ) : (
          list.map(m => (
            <div className="tc-item" key={m.id}>
              <span className={`tc-dot ${tab === "done" ? "done" : "pending"}`} />
              <div className="tc-item-body">
                <span className="tc-item-title">{m.id} · {m.department}</span>
                <span className="tc-item-text">{m.obligation_text}</span>
              </div>
              {m.status === "Complete" && m.ai_verified && (
                <span className="tc-ai-badge" title="AI-verified completion">
                  <Sparkles size={11} />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
