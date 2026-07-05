import "./DashboardHeader.css";
import { Activity, FileText, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardHeader({ onRefresh, loading, analysis = null }) {
  return (
    <div className="dashboard-header glass-panel">
      <div className="dashboard-header-top">
        <div className="dashboard-title">
          <span className="dashboard-badge">REGMAP AI ENTERPRISE</span>
          <h1 className="h1">Executive Compliance Dashboard</h1>
          <p className="body">
            AI-powered regulatory intelligence platform providing enterprise
            compliance monitoring, obligation management, risk analytics and
            executive reporting.
          </p>
        </div>
        <div className="dashboard-status">
          <div className="live-indicator">
            <span className="live-dot"></span>
            LIVE ANALYSIS
          </div>
          <motion.button 
            onClick={() => onRefresh?.()}
            disabled={loading || !onRefresh}
            className="btn btn-secondary"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            <motion.div
              animate={{ rotate: loading ? 360 : 0 }}
              transition={{ repeat: loading ? Infinity : 0, duration: 1, ease: "linear" }}
              style={{ display: "flex" }}
            >
              <RefreshCw size={16} />
            </motion.div>
            {loading ? "Syncing..." : "Refresh"}
          </motion.button>
        </div>
      </div>
      
      <div className="analysis-card">
        <div className="analysis-left">
          <div className="analysis-icon-container">
            <FileText size={28} className="analysis-icon"/>
          </div>
          <div className="analysis-info">
            <span className="analysis-label">CURRENT DOCUMENT</span>
            <h2 className="h3">{analysis?.title || "Enterprise Regulatory Report"}</h2>
            <div className="analysis-meta">
              <span className="meta-item success">
                <Activity size={14}/> AI Processing Complete
              </span>
              <span className="meta-item success">
                <ShieldCheck size={14}/> Verified
              </span>
              <span className="meta-item text">
                <Clock size={14}/> Updated just now
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}