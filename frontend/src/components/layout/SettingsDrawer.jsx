import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Database, Server, BrainCircuit, HardDrive, Moon, Download, RefreshCw, WifiOff, Wifi } from "lucide-react";
import "./Topbar.css";

export default function SettingsDrawer({ open, onClose }) {
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [isOffline, setIsOffline] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDark]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
            }}
          />
          <motion.div
            className="drawer-panel glass-panel"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "400px",
              backgroundColor: "var(--bg-secondary)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--border-light)",
            }}
          >
            <div className="drawer-header flex-between" style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)" }}>
              <h2 className="h3">Enterprise Settings</h2>
              <button className="btn-icon" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-content" style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* System Status */}
              <section>
                <h3 className="subtitle" style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>System Status</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="flex-between" style={{ padding: "12px 16px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Server size={18} color="var(--accent-primary)" />
                      <span className="body" style={{ fontWeight: 500 }}>Backend API</span>
                    </div>
                    <span className="status-badge" style={{ backgroundColor: "var(--success-subtle)", color: "var(--success)", border: "none" }}>Connected</span>
                  </div>

                  <div className="flex-between" style={{ padding: "12px 16px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Database size={18} color="var(--accent-primary)" />
                      <span className="body" style={{ fontWeight: 500 }}>SQLite Database</span>
                    </div>
                    <span className="status-badge" style={{ backgroundColor: "var(--success-subtle)", color: "var(--success)", border: "none" }}>Healthy</span>
                  </div>

                  <div className="flex-between" style={{ padding: "12px 16px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <BrainCircuit size={18} color="var(--accent-primary)" />
                      <span className="body" style={{ fontWeight: 500 }}>AI Local Engine</span>
                    </div>
                    <span className="status-badge" style={{ backgroundColor: "var(--success-subtle)", color: "var(--success)", border: "none" }}>Active</span>
                  </div>
                </div>
              </section>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-light)" }} />

              {/* Configurations */}
              <section>
                <h3 className="subtitle" style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>Configuration</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="flex-between">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {isOffline ? <WifiOff size={18} color="var(--text-tertiary)" /> : <Wifi size={18} color="var(--accent-primary)" />}
                      <div>
                        <div className="body" style={{ fontWeight: 500 }}>Offline Mode</div>
                        <div className="caption">Enforce local AI processing</div>
                      </div>
                    </div>
                    <div 
                      onClick={() => setIsOffline(!isOffline)}
                      style={{ width: "40px", height: "24px", backgroundColor: isOffline ? "var(--success)" : "var(--border-medium)", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "background-color 0.2s" }}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ x: isOffline ? 18 : 2 }}
                        style={{ width: "20px", height: "20px", backgroundColor: "white", borderRadius: "50%", position: "absolute", top: "2px" }} 
                      />
                    </div>
                  </div>

                  <div className="flex-between">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Moon size={18} color={isDark ? "var(--accent-primary)" : "var(--text-tertiary)"} />
                      <div>
                        <div className="body" style={{ fontWeight: 500 }}>Dark Theme</div>
                        <div className="caption">Toggle enterprise dark mode</div>
                      </div>
                    </div>
                    <div 
                      onClick={() => setIsDark(!isDark)}
                      style={{ width: "40px", height: "24px", backgroundColor: isDark ? "var(--accent-primary)" : "var(--border-medium)", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "background-color 0.2s" }}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ x: isDark ? 18 : 2 }}
                        style={{ width: "20px", height: "20px", backgroundColor: "white", borderRadius: "50%", position: "absolute", top: "2px" }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex-between">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <RefreshCw size={18} color="var(--text-tertiary)" />
                      <div>
                        <div className="body" style={{ fontWeight: 500 }}>Auto-Refresh</div>
                        <div className="caption">Interval for background sync</div>
                      </div>
                    </div>
                    <select className="body" style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)" }}>
                      <option>Off</option>
                      <option>1 min</option>
                      <option>5 mins</option>
                    </select>
                  </div>
                </div>
              </section>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-light)" }} />

              {/* Storage & Export */}
              <section>
                <h3 className="subtitle" style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>Storage & Data</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <HardDrive size={18} color="var(--text-tertiary)" />
                  <div style={{ flex: 1 }}>
                    <div className="flex-between" style={{ marginBottom: "4px" }}>
                      <span className="body" style={{ fontWeight: 500 }}>Local Storage</span>
                      <span className="caption">450 MB / 2 GB</span>
                    </div>
                    <div style={{ height: "6px", backgroundColor: "var(--border-light)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: "22%", height: "100%", backgroundColor: "var(--accent-primary)" }} />
                    </div>
                  </div>
                </div>
                
                <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                  <Download size={16} /> Export Enterprise Config
                </button>
              </section>
            </div>

            <div className="drawer-footer" style={{ padding: "16px 24px", borderTop: "1px solid var(--border-light)", textAlign: "center" }}>
              <span className="caption">RegMap AI Enterprise v2.0.0-offline</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
