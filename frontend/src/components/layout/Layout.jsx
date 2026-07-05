import { motion, AnimatePresence } from "framer-motion";
import "./Layout.css";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children, activePage, setActivePage }) {
  return (
    <div className="layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="layout-right">
        <Topbar activePage={activePage} setActivePage={setActivePage} />
        <main className="layout-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", height: "100%" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
