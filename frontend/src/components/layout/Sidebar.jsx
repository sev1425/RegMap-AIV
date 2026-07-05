import { motion } from "framer-motion";
import "./Sidebar.css";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  ClipboardCheck,
  BarChart3,
  GitCompare,
  BrainCircuit,
  Database,
  Bot,
  FileCheck2,
  CalendarDays,
  Settings,
  LogOut
} from "lucide-react";
import { useGlobalContext } from "../../context/GlobalContext";

const menuItems = [
  { title: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { title: "Executive Summary", icon: <FileText size={20} /> },
  { title: "Regulations", icon: <FileText size={20} /> },
  { title: "Conflict Detector", icon: <ShieldAlert size={20} /> },
  { title: "Task Generator", icon: <ClipboardCheck size={20} /> },
  { title: "MAP Tracker", icon: <ClipboardCheck size={20} /> },
  { title: "Analytics", icon: <BarChart3 size={20} /> },
  { title: "Impact Simulator", icon: <GitCompare size={20} /> },
  { title: "Digital Twin", icon: <BrainCircuit size={20} /> },
  { title: "Evidence Validator", icon: <Database size={20} /> },
  { title: "Audit Intelligence", icon: <FileCheck2 size={20} /> },
  { title: "Compliance Calendar", icon: <CalendarDays size={20} /> },
  { title: "AI Copilot", icon: <Bot size={20} /> },
];

const ROLE_ACCESS = {
  'Administrator': menuItems.map(item => item.title), // All access
  'Compliance Officer': ['Dashboard', 'Executive Summary', 'Regulations', 'Conflict Detector', 'Task Generator', 'MAP Tracker', 'Compliance Calendar', 'AI Copilot'],
  'Auditor': ['Dashboard', 'Evidence Validator', 'Audit Intelligence', 'Analytics', 'Compliance Calendar'],
  'Viewer': ['Dashboard', 'Executive Summary', 'Analytics', 'Compliance Calendar']
};

export default function Sidebar({ activePage, setActivePage }) {
  const { userRole, logout } = useGlobalContext();
  
  const allowedItems = menuItems.filter(item => 
    (ROLE_ACCESS[userRole] || []).includes(item.title)
  );
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-circle">
            <ShieldAlert size={20} color="#fff" />
          </div>
          <div className="logo-text">
            <h2>RegMap AI</h2>
            <span>Enterprise Edition</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-menu">
        <div className="sidebar-menu-label">PLATFORM ({userRole?.toUpperCase()})</div>
        {allowedItems.map((item, index) => {
          const isActive = activePage === item.title;
          return (
            <motion.div
              key={index}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              onClick={() => setActivePage(item.title)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="sidebar-icon">{item.icon}</div>
              <span>{item.title}</span>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="active-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="sidebar-footer">
        <div className="sidebar-divider"></div>
        <motion.div className="sidebar-item" whileHover={{ x: 4 }} onClick={logout}>
          <div className="sidebar-icon"><LogOut size={20} /></div>
          <span>Logout</span>
        </motion.div>
      </div>
    </aside>
  );
}
