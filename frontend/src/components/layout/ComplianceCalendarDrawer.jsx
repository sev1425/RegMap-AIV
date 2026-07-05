import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useTimeline } from "../../hooks/useTimeline";
import "./ComplianceCalendarDrawer.css";

const PRIORITY_META = {
  Critical: { label: "Critical", color: "var(--danger)", subtle: "var(--danger-subtle)", icon: AlertTriangle },
  High: { label: "High", color: "var(--danger)", subtle: "var(--danger-subtle)", icon: AlertTriangle },
  Medium: { label: "Medium", color: "var(--warning)", subtle: "var(--warning-subtle)", icon: Info },
  Low: { label: "Low", color: "var(--success)", subtle: "var(--success-subtle)", icon: CheckCircle2 }
};

function normalizePriority(p) {
  if (!p) return "Low";
  const v = String(p).toLowerCase();
  if (v.includes("critical")) return "Critical";
  if (v.includes("high")) return "High";
  if (v.includes("medium")) return "Medium";
  if (v.includes("low")) return "Low";
  return "Low";
}

export default function ComplianceCalendarDrawer({ open, onClose }) {
  const { data, loading, error, refresh } = useTimeline();

  const items = useMemo(() => {
    // Timeline API shape unknown; normalize broadly.
    const raw = data?.items ?? data?.timeline ?? data?.data ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [data]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="calendar-drawer"
          initial={{ opacity: 0, x: 280 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 280 }}
          transition={{ type: "tween", duration: 0.25 }}
        >
          <div className="calendar-drawer-header">
            <div className="calendar-drawer-title">
              <CalendarDays size={18} />
              <div>
                <div className="h3" style={{ margin: 0 }}>Compliance Calendar</div>
                <div className="caption">Deadlines, audits, evidence due, and reviews</div>
              </div>
            </div>
            <div className="calendar-drawer-actions">
              <button className="btn-icon" onClick={refresh} title="Refresh timeline" aria-label="Refresh timeline">
                <span className="btn-icon-text">↻</span>
              </button>
              <button className="btn-icon" onClick={onClose} title="Close" aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="calendar-drawer-body">
            {loading && (
              <div className="calendar-skeleton">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton calendar-skeleton-row" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="error-inline">
                <AlertTriangle size={18} />
                <div>
                  <div className="h3" style={{ margin: 0 }}>Unable to load timeline</div>
                  <div className="caption">{error}</div>
                </div>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="empty-inline">
                <div className="empty-icon">🗓️</div>
                <div className="h3" style={{ margin: 0 }}>No calendar items</div>
                <div className="caption">Upload and analyze a document to generate deadlines.</div>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="calendar-list">
                {items
                  .slice()
                  .sort((a, b) => (a.date || a.deadline_date || 0) > (b.date || b.deadline_date || 0) ? 1 : -1)
                  .map((it, idx) => {
                    const priority = normalizePriority(it.priority || it.severity || it.level);
                    const meta = PRIORITY_META[priority] || PRIORITY_META.Low;

                    const title = it.title || it.event || it.type || "Compliance Event";
                    const date = it.date || it.deadline_date || it.deadline || it.due_date || "Unknown date";
                    const department = it.department || it.dept || it.owner_department || "General";
                    const status = it.status || it.state || "Upcoming";

                    return (
                      <motion.button
                        key={idx}
                        className="calendar-item"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          // keep architecture: drawer-only, item click can be expanded later.
                          // currently a no-op beyond visual selection.
                        }}
                      >
                        <div className="calendar-item-left">
                          <span
                            className="priority-pill"
                            style={{
                              backgroundColor: meta.subtle,
                              color: meta.color,
                              borderColor: "rgba(255,255,255,0.08)"
                            }}
                          >
                            {meta.label}
                          </span>
                          <div className="calendar-item-title">{title}</div>
                          <div className="caption" style={{ marginTop: 4 }}>
                            {department}
                            {status ? ` • ${status}` : ""}
                          </div>
                        </div>
                        <div className="calendar-item-right">
                          <div className="calendar-date">{String(date)}</div>
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

