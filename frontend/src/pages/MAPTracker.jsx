// ==========================================================
// REGMAP AI ENTERPRISE
// MAP TRACKER — Measurable Action Points
// The core page for the hackathon theme
// ==========================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, RefreshCw, Filter, CheckCircle2,
  Clock, AlertTriangle, Building2, Calendar, ShieldAlert,
  ChevronDown, ChevronUp, FileCheck, Sparkles, Lightbulb, History
} from "lucide-react";
import { useGlobalContext } from "../context/GlobalContext";
import "./EnterprisePages.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const PRIORITY_COLORS = {
  Critical: { bg: "rgba(239,68,68,0.12)", border: "#ef4444", text: "#ef4444" },
  High:     { bg: "rgba(249,115,22,0.12)", border: "#f97316", text: "#f97316" },
  Medium:   { bg: "rgba(234,179,8,0.12)",  border: "#eab308", text: "#eab308" },
  Low:      { bg: "rgba(16,185,129,0.12)", border: "#10b981", text: "#10b981" },
};

const STATUS_COLORS = {
  "Pending":      "#ef4444",
  "In Progress":  "#f97316",
  "Under Review": "#3b82f6",
  "Complete":     "#10b981",
};

const STATUS_ICONS = {
  "Pending":      <Clock size={13} />,
  "In Progress":  <RefreshCw size={13} />,
  "Under Review": <ShieldAlert size={13} />,
  "Complete":     <CheckCircle2 size={13} />,
};

function MAPCard({ map, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const pc = PRIORITY_COLORS[map.priority] || PRIORITY_COLORS.Low;

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await fetch(`${API}/maps/${map.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusChange(map.id, newStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: expanded ? "rgba(99,102,241,0.04)" : "var(--bg-secondary)",
        border: `1px solid ${expanded ? "rgba(99,102,241,0.35)" : "var(--border-light)"}`,
        borderLeft: `3px solid ${pc.border}`,
        borderRadius: 8,
        marginBottom: 10,
        overflow: "hidden",
        transition: "border 0.2s",
      }}
    >
      {/* Header Row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 140px 110px 110px 130px 32px",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          cursor: "pointer",
        }}
      >
        {/* MAP ID */}
        <span style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: 12 }}>
          {map.id}
        </span>

        {/* Obligation text */}
        <span style={{
          color: "var(--text-primary)",
          fontSize: 12,
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: expanded ? "normal" : "nowrap",
        }}>
          {map.obligation_text}
        </span>

        {/* Department */}
        <span style={{
          display: "flex", alignItems: "center", gap: 5,
          color: "#8b5cf6", fontSize: 11, fontWeight: 600
        }}>
          <Building2 size={12} /> {map.department}
        </span>

        {/* Priority */}
        <span style={{
          padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
          background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
          textAlign: "center",
        }}>
          {map.priority}
        </span>

        {/* Deadline */}
        <span style={{
          display: "flex", alignItems: "center", gap: 5,
          color: map.days_to_deadline <= 7 ? "#ef4444" : "var(--text-secondary)",
          fontSize: 11,
        }}>
          <Calendar size={12} /> {map.deadline_label}
        </span>

        {/* Status dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <select
            value={map.status}
            disabled={updating}
            onChange={e => { e.stopPropagation(); handleStatus(e.target.value); }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--bg-primary)",
              border: `1px solid ${STATUS_COLORS[map.status] || "#334155"}`,
              color: STATUS_COLORS[map.status] || "var(--text-primary)",
              borderRadius: 4, padding: "4px 6px", fontSize: 10,
              fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
            }}
          >
            {["Pending","In Progress","Under Review","Complete"].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          {map.status === "Complete" && map.ai_verified && (
            <span title="Verified by AI auto-resolution" style={{
              display: "inline-flex", alignItems: "center", color: "#a78bfa",
            }}>
              <Sparkles size={12} />
            </span>
          )}
        </div>

        {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: "1px solid var(--border-light)", padding: "16px", overflow: "hidden" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Full Obligation
                </div>
                <div style={{ color: "var(--text-primary)", fontSize: 12, lineHeight: 1.6 }}>
                  {map.obligation_text}
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: "#64748b" }}>
                  Source: {map.obligation_id} · Confidence: {Math.round((map.confidence || 1) * 100)}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Evidence Required
                </div>
                {(map.evidence_required || "").split(";").map((e, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 6,
                    marginBottom: 6, color: "var(--text-secondary)", fontSize: 11
                  }}>
                    <FileCheck size={12} style={{ color: "#6366f1", marginTop: 2, flexShrink: 0 }} />
                    {e.trim()}
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Penalty Exposure
                </div>
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 6, padding: "10px 12px"
                }}>
                  <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>
                    {map.penalty_exposure}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
                    Due: {map.deadline_date}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Department Routing</div>
                  <span style={{
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: 4, padding: "3px 8px", color: "#8b5cf6", fontSize: 11, fontWeight: 600,
                  }}>
                    Primary: {map.department}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MAPTracker() {
  const { triggerGlobalRefresh } = useGlobalContext();
  const [maps, setMaps] = useState([]);
  const [summary, setSummary] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [tab, setTab] = useState("pending"); // "pending" | "done" | "recommended" | "history"

  const fetchMaps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/maps/`);
      const data = await res.json();
      if (data.success) {
        setMaps(data.maps || []);
        setSummary(data.summary || {});
        setRecommendations(data.recommendations || []);
      } else {
        setError(data.message || "No analysis found. Upload a circular first.");
      }
    } catch (e) {
      setError("Cannot connect to backend. Is it running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/maps/history`);
      const data = await res.json();
      if (data.success) setHistory(data.events || []);
    } catch (e) {
      // History is supplementary — fail silently and keep the previous list.
    }
  };

  useEffect(() => { fetchMaps(); fetchHistory(); }, []);

  const handleStatusChange = (id, newStatus) => {
    setMaps(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    fetchMaps();
    fetchHistory();
    triggerGlobalRefresh();
  };

  const departments = ["All", ...new Set(maps.map(m => m.department))];
  const priorities = ["All", "Critical", "High", "Medium", "Low"];

  const doneMaps = maps.filter(m => m.status === "Complete");
  const pendingMaps = maps.filter(m => m.status !== "Complete");
  const tabSource = tab === "done" ? doneMaps : pendingMaps;

  const filtered = tabSource.filter(m => {
    const pMatch = filter === "All" || m.priority === filter;
    const dMatch = deptFilter === "All" || m.department === deptFilter;
    return pMatch && dMatch;
  });

  if (loading) return (
    <div className="state-panel">
      <div className="enterprise-spinner" />
      <h2>Loading MAPs</h2>
      <p>Fetching Measurable Action Points from the AI pipeline...</p>
    </div>
  );

  if (error) return (
    <div className="state-panel">
      <AlertTriangle size={40} color="#f97316" />
      <h2>No MAPs Available</h2>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={fetchMaps} style={{ marginTop: 16 }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  return (
    <div style={{ padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          <ClipboardCheck size={20} style={{ marginRight: 8, color: "var(--accent-primary)", verticalAlign: "middle" }} />
          Measurable Action Points
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Every regulatory obligation converted to a trackable action — with department, deadline, evidence, and penalty exposure.
        </p>
      </div>

      {/* KPI Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total MAPs",  value: maps.length,          color: "#6366f1" },
          { label: "Critical",    value: summary.critical || 0, color: "#ef4444" },
          { label: "High",        value: summary.high || 0,     color: "#f97316" },
          { label: "Pending",     value: summary.pending || 0,  color: "#f59e0b" },
          { label: "Complete",    value: maps.filter(m => m.status === "Complete").length, color: "#10b981" },
        ].map((k, i) => (
          <div key={i} style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border-light)",
            borderRadius: 8, padding: "16px", textAlign: "center"
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginTop: 4 }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Done / Pending Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--border-light)" }}>
        <button
          onClick={() => setTab("pending")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", fontSize: 13, fontWeight: 700,
            background: "transparent", border: "none", cursor: "pointer",
            color: tab === "pending" ? "var(--accent-primary)" : "var(--text-secondary)",
            borderBottom: tab === "pending" ? "2px solid var(--accent-primary)" : "2px solid transparent",
            marginBottom: -1,
          }}
        >
          <Clock size={14} /> Pending ({pendingMaps.length})
        </button>
        <button
          onClick={() => setTab("done")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", fontSize: 13, fontWeight: 700,
            background: "transparent", border: "none", cursor: "pointer",
            color: tab === "done" ? "#10b981" : "var(--text-secondary)",
            borderBottom: tab === "done" ? "2px solid #10b981" : "2px solid transparent",
            marginBottom: -1,
          }}
        >
          <CheckCircle2 size={14} /> Done ({doneMaps.length})
        </button>
        <button
          onClick={() => setTab("recommended")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", fontSize: 13, fontWeight: 700,
            background: "transparent", border: "none", cursor: "pointer",
            color: tab === "recommended" ? "#a78bfa" : "var(--text-secondary)",
            borderBottom: tab === "recommended" ? "2px solid #a78bfa" : "2px solid transparent",
            marginBottom: -1,
          }}
        >
          <Lightbulb size={14} /> Recommended ({recommendations.length})
        </button>
        <button
          onClick={() => setTab("history")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", fontSize: 13, fontWeight: 700,
            background: "transparent", border: "none", cursor: "pointer",
            color: tab === "history" ? "#3b82f6" : "var(--text-secondary)",
            borderBottom: tab === "history" ? "2px solid #3b82f6" : "2px solid transparent",
            marginBottom: -1,
          }}
        >
          <History size={14} /> History ({history.length})
        </button>
      </div>

      {/* Filters — only relevant for Pending / Done tabs */}
      {(tab === "pending" || tab === "done") && (
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Filter size={14} color="#64748b" />
        <span style={{ fontSize: 11, color: "#64748b" }}>Priority:</span>
        {priorities.map(p => (
          <button key={p} onClick={() => setFilter(p)} style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            cursor: "pointer", border: "1px solid",
            background: filter === p ? "var(--accent-primary)" : "transparent",
            borderColor: filter === p ? "var(--accent-primary)" : "var(--border-light)",
            color: filter === p ? "#fff" : "var(--text-secondary)",
          }}>{p}</button>
        ))}
        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>Dept:</span>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border-light)",
            color: "var(--text-primary)", borderRadius: 6, padding: "4px 10px",
            fontSize: 11, fontFamily: "inherit", cursor: "pointer"
          }}
        >
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>

        <button onClick={() => { fetchMaps(); fetchHistory(); }} style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: "transparent", border: "1px solid var(--border-light)",
          color: "var(--text-secondary)", cursor: "pointer"
        }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      )}

      {(tab === "pending" || tab === "done") && (
      <>
      {/* Table Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 140px 110px 110px 130px 32px",
        gap: 12, padding: "8px 16px",
        fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
        color: "var(--accent-primary)", textTransform: "uppercase",
        borderBottom: "1px solid var(--border-light)", marginBottom: 8,
      }}>
        <span>MAP ID</span>
        <span>Obligation</span>
        <span>Department</span>
        <span>Priority</span>
        <span>Deadline</span>
        <span>Status</span>
        <span></span>
      </div>

      {/* MAP Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
          {tabSource.length === 0
            ? (tab === "done"
                ? "No MAPs completed yet — mark a MAP Complete or use Task Generator's Auto-Resolve."
                : "Nothing pending — every MAP has been completed.")
            : "No MAPs match the current filter."}
        </div>
      ) : (
        filtered.map(map => (
          <MAPCard key={map.id} map={map} onStatusChange={handleStatusChange} />
        ))
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: "#64748b", textAlign: "center" }}>
        Showing {filtered.length} of {tabSource.length} {tab === "done" ? "completed" : "pending"} MAPs
      </div>
      </>
      )}

      {/* Recommended Actions */}
      {tab === "recommended" && (
        <RecommendedActionsPanel recommendations={recommendations} maps={maps} />
      )}

      {/* History */}
      {tab === "history" && (
        <HistoryPanel events={history} />
      )}
    </div>
  );
}

// ==========================================================
// Recommended Actions — AI-generated next steps, sourced from
// the same RecommendationEngine output used in the executive
// report and Conflict Detector.
// ==========================================================
const REC_PRIORITY_COLORS = {
  Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#10b981",
};

function RecommendedActionsPanel({ recommendations, maps }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
        No AI recommendations available for this analysis yet.
      </div>
    );
  }

  const mapById = Object.fromEntries((maps || []).map(m => [m.obligation_id, m]));

  return (
    <div>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 16 }}>
        AI-generated next steps based on the obligations, risks, and conflicts found in this document.
      </p>
      {recommendations.map(rec => {
        const linkedMap = rec.related_risk ? mapById[rec.related_risk] : null;
        const color = REC_PRIORITY_COLORS[rec.priority] || "#6366f1";
        return (
          <div key={rec.id} style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border-light)",
            borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Lightbulb size={13} color={color} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{rec.title}</span>
                  <span style={{
                    padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                    background: `${color}22`, color, border: `1px solid ${color}55`,
                  }}>{rec.priority}</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {rec.recommendation}
                </p>
                <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 10, color: "#64748b" }}>
                  <span>Department: <strong style={{ color: "#8b5cf6" }}>{rec.department}</strong></span>
                  <span>Confidence: <strong>{rec.confidence}%</strong></span>
                  {linkedMap && <span>Linked MAP: <strong style={{ color: "var(--accent-primary)" }}>{linkedMap.id}</strong></span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================================
// History — flattened, time-sorted status-change activity log
// across every MAP (manual edits + AI auto-resolutions).
// ==========================================================
function HistoryPanel({ events }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
        No status changes recorded yet. History appears here as soon as a MAP's status is updated.
      </div>
    );
  }

  const fmtTime = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 16 }}>
        Every status change across all MAPs, most recent first.
      </p>
      {events.map((e, i) => {
        const isAI = e.actor === "AI Copilot";
        return (
          <div key={i} style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            padding: "12px 0", borderBottom: "1px solid var(--border-light)",
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isAI ? "rgba(167,139,250,0.12)" : "rgba(99,102,241,0.12)",
              color: isAI ? "#a78bfa" : "var(--accent-primary)",
            }}>
              {isAI ? <Sparkles size={13} /> : <History size={13} />}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                <strong style={{ color: "var(--accent-primary)" }}>{e.map_id}</strong>
                {" "}status changed from{" "}
                <span style={{ color: STATUS_COLORS[e.from_status] || "#94a3b8" }}>{e.from_status}</span>
                {" → "}
                <span style={{ color: STATUS_COLORS[e.to_status] || "#94a3b8", fontWeight: 700 }}>{e.to_status}</span>
                {isAI && <span style={{ marginLeft: 6, fontSize: 10, color: "#a78bfa", fontWeight: 700 }}>· AI VERIFIED</span>}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {e.obligation_text?.slice(0, 90)}{e.obligation_text?.length > 90 ? "…" : ""}
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>
                {fmtTime(e.timestamp)} · by {e.actor} · {e.department}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
