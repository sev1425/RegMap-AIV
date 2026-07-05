import { useState } from "react";
import { motion } from "framer-motion";
import { useGlobalContext } from "../../context/GlobalContext";
import "./Topbar.css";

import {
  Search,
  Download,
  Plus,
  UserCircle,
  CalendarDays,
  Settings,
  LogOut
} from "lucide-react";

import ComplianceCalendarDrawer from "./ComplianceCalendarDrawer";
import SettingsDrawer from "./SettingsDrawer";

export default function Topbar({ activePage, setActivePage }) {
  const { userRole, logout } = useGlobalContext();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search wiring is handled in later wave once backend endpoint is confirmed.
  const [searchValue, setSearchValue] = useState("");

  const handleExport = () => {
    setActivePage?.("Audit Intelligence");
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="page-title">{activePage}</h1>
        </div>

        <div className="topbar-right">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search regulations, risks, obligations..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          <div className="status-badge">
            <span className="status-dot"></span>
            Offline AI Mode
          </div>

          <motion.button
            className="icon-btn"
            onClick={() => setShowCalendar(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Compliance Calendar"
          >
            <CalendarDays size={18} />
          </motion.button>

          <motion.button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Settings"
          >
            <Settings size={18} />
          </motion.button>

          <motion.button
            className="icon-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Logout"
          >
            <LogOut size={18} />
          </motion.button>

          <div className="topbar-divider" />

          <motion.button
            className="btn btn-secondary"
            onClick={handleExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={16} />
            Export
          </motion.button>

          <motion.button
            className="btn btn-primary"
            onClick={() => setActivePage?.("Regulations")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={16} />
            New Analysis
          </motion.button>

          <div className="profile">
            <div className="profile-info">
              <h4>{userRole}</h4>
              <span>RegMap Enterprise User</span>
            </div>
            <UserCircle size={36} className="profile-icon" />
          </div>
        </div>
      </header>

      <div style={{ position: "relative" }}>
        <ComplianceCalendarDrawer open={showCalendar} onClose={() => setShowCalendar(false)} />
        <SettingsDrawer open={showSettings} onClose={() => setShowSettings(false)} />
      </div>

      {/* Notifications + full Settings drawer are in the next wave because backend endpoints
          must be confirmed and wired to avoid introducing placeholder/dummy UI again. */}
    </>
  );
}