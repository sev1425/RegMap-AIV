import { useState } from "react";
import { Toaster } from "react-hot-toast";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Regulations from "./pages/Regulations";
import AICopilot from "./pages/AICopilot";
import ConflictDetector from "./pages/ConflictDetector";
import Simulator from "./pages/Simulator";
import EvidenceValidator from "./pages/EvidenceValidator";
import AuditAgent from "./pages/AuditAgent";
import Analytics from "./pages/Analytics";
import DigitalTwin from "./pages/DigitalTwin";
import TaskGenerator from "./pages/TaskGenerator";
import ExecutiveSummary from "./pages/Summary";
import ComplianceCalendar from "./pages/Calendar";
import Login from "./pages/Login";
import MAPTracker from "./pages/MAPTracker";
import { GlobalProvider, useGlobalContext } from "./context/GlobalContext";

function AppContent() {
  const { userRole } = useGlobalContext();
  const [activePage, setActivePage] = useState("Dashboard");

  if (!userRole) {
    return <Login />;
  }


  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === "Dashboard" && <Dashboard setActivePage={setActivePage} />}
      {activePage === "Executive Summary" && <ExecutiveSummary setActivePage={setActivePage} />}
      {activePage === "Regulations" && <Regulations setActivePage={setActivePage} />}
      {activePage === "Conflict Detector" && <ConflictDetector />}
      {activePage === "Task Generator" && <TaskGenerator />}
      {activePage === "Analytics" && <Analytics />}
      {activePage === "Impact Simulator" && <Simulator />}
      {activePage === "Digital Twin" && <DigitalTwin />}
      {activePage === "Evidence Validator" && <EvidenceValidator />}
      {activePage === "Audit Intelligence" && <AuditAgent />}
      {activePage === "Compliance Calendar" && <ComplianceCalendar setActivePage={setActivePage} />}
      {activePage === "MAP Tracker" && <MAPTracker />}
      {activePage === "AI Copilot" && <AICopilot />}
    </Layout>
  );
}

export default function App() {
  return (
    <GlobalProvider>
      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      <AppContent />
    </GlobalProvider>
  );
}
