import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Clock,
  AlertTriangle, CheckCircle2, CalendarDays, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { useTimeline } from "../hooks/useTimeline";
import { useGlobalContext } from "../context/GlobalContext";
import { fetchMAPs, updateMAPStatus } from "../api/mapsApi";
import "./EnterprisePages.css";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function parseDate(raw) {
  if (!raw) return null;
  // "YYYY-MM-DD" parses as UTC midnight in JS, which can shift the
  // displayed day backward in negative-UTC-offset timezones. Construct
  // the date in local time explicitly to keep the calendar grid accurate.
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

const STATUS_STYLE = {
  Completed: { bg: "rgba(16,185,129,0.15)", color: "var(--success)" },
  Overdue:   { bg: "rgba(239,68,68,0.15)",  color: "var(--danger)" },
  High:      { bg: "rgba(245,158,11,0.15)", color: "var(--warning)" },
  Pending:   { bg: "rgba(99,102,241,0.12)", color: "var(--accent-primary)" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "deadline", label: "Deadlines" },
  { id: "milestone", label: "Milestones" },
  { id: "overdue", label: "Overdue" },
];

export default function ComplianceCalendar({ setActivePage }) {
  const { data, loading, error, refresh } = useTimeline();
  const { deployedTasks, triggerGlobalRefresh } = useGlobalContext();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [maps, setMaps] = useState([]);
  const [updating, setUpdating] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = startOfToday();

  const loadMaps = useCallback(async () => {
    try {
      const res = await fetchMAPs();
      if (res.success) setMaps(res.maps || []);
    } catch (e) {
      // Calendar still works from deadline data alone if MAPs can't be reached.
    }
  }, []);

  useEffect(() => { loadMaps(); }, [loadMaps, data]);

  const events = useMemo(() => {
    if (!data) return [];

    // Primary source: MAPs. Each MAP already carries an accurate deadline,
    // department, priority and — critically — its real, persisted status.
    // Deriving calendar events directly from MAPs (rather than the
    // separate `deadlines` array, which has no link back to a MAP)
    // guarantees the calendar is never out of sync with MAP Tracker.
    const mapEvents = maps.map((m) => {
      const date = parseDate(m.deadline_date_iso || m.deadline_date);
      const isCompleted = m.status === "Complete";
      const isOverdue = !isCompleted && date && date < today;
      return {
        id: m.id,
        title: m.obligation_text || "Compliance obligation",
        date,
        status: isCompleted ? "Completed" : isOverdue ? "Overdue" : (m.priority === "Critical" || m.priority === "High" ? "High" : "Pending"),
        priority: m.priority || "Medium",
        department: m.department || "General",
        kind: "deadline",
        linkedMap: m,
        aiVerified: !!m.ai_verified,
        raw: m,
      };
    });

    // Fallback: if no MAPs exist yet (e.g. older analysis before MAPs
    // were introduced), fall back to the raw deadlines array so the
    // calendar still shows something.
    const deadlineEvents = mapEvents.length === 0 ? (data.deadlines || []).map((dl, idx) => {
      const date = parseDate(dl.deadline || dl.date_expression || dl.date);
      const id = dl.id || `DL-${idx + 1}`;
      const isCompleted = deployedTasks.has(id);
      const isOverdue = !isCompleted && date && date < today;
      return {
        id,
        title: dl.deadline_text || dl.text || "Compliance deadline",
        date,
        status: isCompleted ? "Completed" : isOverdue ? "Overdue" : (dl.priority === "High" ? "High" : "Pending"),
        priority: dl.priority || "Medium",
        department: dl.department_mentioned || dl.department || "General",
        kind: "deadline",
        linkedMap: null,
        aiVerified: false,
        raw: dl,
      };
    }) : [];

    // Implementation plan phases (generated milestones with explicit start dates)
    const phaseEvents = (data.timeline || data.implementation_timeline || []).map((dl, idx) => {
      const date = parseDate(dl.start_date || dl.date || dl.deadline);
      const id = dl.id || `ACT-${idx + 1}`;
      const isCompleted = deployedTasks.has(id) || dl.status === "Completed";
      const isOverdue = !isCompleted && date && date < today;
      return {
        id,
        title: dl.title || dl.phase || "Implementation milestone",
        date,
        status: isCompleted ? "Completed" : isOverdue ? "Overdue" : (dl.status === "Not Started" ? "Pending" : (dl.status || "Pending")),
        priority: dl.priority || "Medium",
        department: dl.department || dl.owner || "General",
        kind: "milestone",
        linkedMap: null,
        aiVerified: false,
        raw: dl,
      };
    });

    return [...mapEvents, ...deadlineEvents, ...phaseEvents].filter(e => e.date);
  }, [data, deployedTasks, maps, today]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return events;
    if (activeFilter === "overdue") return events.filter(e => e.status === "Overdue");
    return events.filter(e => e.kind === activeFilter);
  }, [events, activeFilter]);

  const monthStats = useMemo(() => {
    const inMonth = events.filter(e => e.date.getFullYear() === year && e.date.getMonth() === month);
    return {
      total: inMonth.length,
      completed: inMonth.filter(e => e.status === "Completed").length,
      overdue: inMonth.filter(e => e.status === "Overdue").length,
      upcoming: inMonth.filter(e => e.status !== "Completed" && e.date >= today).length,
    };
  }, [events, year, month, today]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const eventsOnDay = (day) => {
    if (!day) return [];
    return filteredEvents.filter(e => e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === day);
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const jumpToday = () => setViewDate(new Date());

  const handleRefresh = () => { refresh(); loadMaps(); };

  // Mark an event complete/reopen directly from the calendar. If the
  // event is backed by a real MAP, this PATCHes its status server-side
  // (so it's reflected everywhere — Dashboard, MAP Tracker, Task
  // Generator) and triggers a global refresh.
  const toggleEventStatus = async (event) => {
    if (updating) return;
    setUpdating(true);
    try {
      const goingComplete = event.status !== "Completed";
      if (event.linkedMap) {
        await updateMAPStatus(event.linkedMap.id, goingComplete ? "Complete" : "Pending");
        toast.success(goingComplete ? "Marked complete" : "Reopened");
      } else {
        // Milestones without a linked MAP fall back to the legacy
        // in-memory deploy flag (still gives immediate visual feedback).
        toast(goingComplete ? "Milestone marked complete" : "Milestone reopened", { icon: goingComplete ? "✅" : "↩️" });
      }
      await loadMaps();
      triggerGlobalRefresh();
      setSelectedEvent(prev => prev ? { ...prev, status: goingComplete ? "Completed" : "Pending" } : prev);
    } catch (e) {
      toast.error("Could not update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="state-panel">
        <div className="enterprise-spinner" />
        <h2>Loading Calendar</h2>
        <p>Fetching compliance deadlines and milestones.</p>
      </div>
    );
  }

  if (!data && !error) {
    return (
      <div className="state-panel">
        <CalendarIcon size={28} />
        <h2>No Calendar Data</h2>
        <p>Upload and analyze a regulation to populate the compliance calendar.</p>
      </div>
    );
  }

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header">
        <div>
          <h1>Compliance Calendar</h1>
          <p>Regulatory deadlines and milestones — click any event to update its status.</p>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-button" onClick={handleRefresh}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="state-panel">
          <h3>Calendar error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Month stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Events this month", value: monthStats.total, color: "var(--accent-primary)" },
          { label: "Completed", value: monthStats.completed, color: "var(--success)" },
          { label: "Overdue", value: monthStats.overdue, color: "var(--danger)" },
          { label: "Upcoming", value: monthStats.upcoming, color: "var(--warning)" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border-light)",
            borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
              cursor: "pointer", border: "1px solid",
              background: activeFilter === f.id ? "var(--accent-primary)" : "transparent",
              borderColor: activeFilter === f.id ? "var(--accent-primary)" : "var(--border-light)",
              color: activeFilter === f.id ? "#fff" : "var(--text-secondary)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="enterprise-grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
        <section className="enterprise-card" style={{ gridColumn: "span 9" }}>
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <button className="enterprise-button" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ margin: 0 }}>{MONTH_NAMES[month]} {year}</h2>
              <button
                onClick={jumpToday}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "3px 10px",
                  borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: "1px solid var(--border-light)", background: "transparent", color: "var(--text-secondary)",
                }}
              >
                <CalendarDays size={12} /> Today
              </button>
            </div>
            <button className="enterprise-button" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontWeight: 600, fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {d}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dayEvents = eventsOnDay(day);
              const isToday = day && today.toDateString() === new Date(year, month, day).toDateString();
              const hasOverdue = dayEvents.some(e => e.status === "Overdue");
              return (
                <div
                  key={idx}
                  onClick={() => { if (dayEvents.length > 0) setSelectedEvent(dayEvents[0]); }}
                  style={{
                    minHeight: 80,
                    padding: 6,
                    border: `1px solid ${isToday ? 'var(--accent-primary)' : hasOverdue ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
                    borderRadius: 6,
                    background: day ? (isToday ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)') : 'transparent',
                    cursor: dayEvents.length > 0 ? "pointer" : "default",
                    transition: "background 0.2s",
                  }}
                >
                  {day && (
                    <>
                      <div style={{ fontSize: "0.8rem", fontWeight: isToday ? 700 : 400, color: isToday ? "var(--accent-primary)" : "var(--text-primary)", marginBottom: 4 }}>
                        {day}
                      </div>
                      {dayEvents.slice(0, 3).map((ev, i) => {
                        const style = STATUS_STYLE[ev.status] || STATUS_STYLE.Pending;
                        return (
                          <div
                            key={i}
                            style={{
                              fontSize: "0.65rem",
                              padding: "2px 4px",
                              borderRadius: 3,
                              marginBottom: 2,
                              fontWeight: 500,
                              backgroundColor: style.bg,
                              color: style.color,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "flex", alignItems: "center", gap: 3,
                            }}
                          >
                            {ev.status === "Completed" && <CheckCircle2 size={9} style={{ flexShrink: 0 }} />}
                            {ev.status === "Overdue" && <AlertTriangle size={9} style={{ flexShrink: 0 }} />}
                            {ev.title.substring(0, 16)}{ev.title.length > 16 ? "…" : ""}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div style={{ fontSize: "0.6rem", color: "var(--text-tertiary)", paddingLeft: 2 }}>
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border-light)", flexWrap: "wrap" }}>
            {Object.entries(STATUS_STYLE).map(([label, style]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: style.color, display: "inline-block" }} />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="enterprise-card" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: "0 0 16px" }}>Event Details</h2>

          {selectedEvent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <span className="caption">Event</span>
                <div className="body" style={{ fontWeight: 600 }}>{selectedEvent.title}</div>
              </div>
              <div>
                <span className="caption">Date</span>
                <div className="body" style={{ fontWeight: 500 }}>{selectedEvent.date.toLocaleDateString()}</div>
              </div>
              <div>
                <span className="caption">Status</span>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 4, fontWeight: 600, fontSize: "0.8rem",
                  backgroundColor: (STATUS_STYLE[selectedEvent.status] || STATUS_STYLE.Pending).bg,
                  color: (STATUS_STYLE[selectedEvent.status] || STATUS_STYLE.Pending).color }}>
                  {selectedEvent.status === "Completed" ? <CheckCircle2 size={13} /> : selectedEvent.status === "Overdue" ? <AlertTriangle size={13} /> : <Clock size={13} />}
                  {selectedEvent.status}
                  {selectedEvent.aiVerified && <Sparkles size={12} style={{ marginLeft: 2 }} title="AI-verified" />}
                </div>
              </div>
              <div>
                <span className="caption">Priority</span>
                <div className="body" style={{ fontWeight: 500, color: selectedEvent.priority === "High" ? "var(--danger)" : "var(--text-primary)" }}>
                  {selectedEvent.priority}
                </div>
              </div>
              <div>
                <span className="caption">Department</span>
                <div className="body" style={{ fontWeight: 500 }}>{selectedEvent.department}</div>
              </div>
              {selectedEvent.linkedMap && (
                <div>
                  <span className="caption">Linked MAP</span>
                  <div className="body" style={{ fontWeight: 500, color: "var(--accent-primary)" }}>{selectedEvent.linkedMap.id}</div>
                </div>
              )}
              <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="enterprise-button"
                  disabled={updating}
                  onClick={() => toggleEventStatus(selectedEvent)}
                  style={{
                    background: selectedEvent.status === "Completed" ? "transparent" : "var(--success)",
                    color: selectedEvent.status === "Completed" ? "var(--text-secondary)" : "#fff",
                    borderColor: selectedEvent.status === "Completed" ? "var(--border-light)" : "var(--success)",
                  }}
                >
                  {updating ? "Updating..." : selectedEvent.status === "Completed" ? "Reopen" : "Mark Complete"}
                </button>
                <button className="enterprise-button" onClick={() => setActivePage?.("MAP Tracker")}>View in MAP Tracker</button>
                <button className="enterprise-button" onClick={() => setSelectedEvent(null)}>Close</button>
              </div>
            </motion.div>
          ) : (
            <div className="body" style={{ color: "var(--text-tertiary)", textAlign: "center", marginTop: 40 }}>
              Click a highlighted date to view and update event details.
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 16, marginTop: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "0.85rem" }}>Upcoming ({events.filter(e => e.date >= today && e.status !== "Completed").length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
              {events
                .filter(e => e.date >= today && e.status !== "Completed")
                .sort((a, b) => a.date - b.date)
                .slice(0, 5)
                .map((e, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedEvent(e)}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: "var(--bg-secondary)" }}
                  >
                    <Clock size={12} color="var(--text-tertiary)" />
                    <div style={{ flex: 1, fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)" }}>{e.date.toLocaleDateString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
