import { motion, AnimatePresence } from "framer-motion";
import "../components/dashboard/Dashboard.css";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import KPIGrid from "../components/dashboard/KPIGrid";
import ComplianceChart from "../components/charts/ComplianceChart";
import RiskChart from "../components/charts/RiskChart";
import DepartmentChart from "../components/charts/DepartmentChart";
import DeadlineList from "../components/dashboard/DeadlineList";
import ObligationList from "../components/dashboard/ObligationList";
import Insights from "../components/dashboard/Insights";
import TaskCompletionPanel from "../components/dashboard/TaskCompletionPanel";
import Pipeline from "../components/pipeline/Pipeline";

import { useDashboard } from "../hooks/useDashboard";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard({ setActivePage }) {
    const { data, loading, error, refresh } = useDashboard();

    return (
        <div className="dashboard-page">
            <DashboardHeader onRefresh={refresh} loading={loading} analysis={data} />

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="loading-skeleton-container"
                    >
                        <div className="skeleton-grid">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton skeleton-card"></div>
                            ))}
                        </div>
                        <div className="skeleton-row">
                            <div className="skeleton skeleton-chart-large"></div>
                            <div className="skeleton skeleton-chart-small"></div>
                        </div>
                    </motion.div>
                ) : error ? (
                    <motion.div 
                        key="error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-panel flex-center flex-column error-state"
                        style={{ padding: "40px", marginTop: "20px", color: "var(--danger)" }}
                    >
                        <h3>Error Loading Enterprise Data</h3>
                        <p>{error}</p>
                        <button onClick={refresh} className="btn btn-primary" style={{ marginTop: "16px" }}>Retry Connection</button>
                    </motion.div>
                ) : data ? (
                    <motion.div
                        key="content"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        <motion.div variants={itemVariants}>
                            <KPIGrid data={data} />
                        </motion.div>

                        <div className="dashboard-row">
                            <motion.div variants={itemVariants} className="dashboard-column-large">
                                <ComplianceChart data={data} />
                            </motion.div>
                            <motion.div variants={itemVariants} className="dashboard-column">
                                <RiskChart data={data} />
                            </motion.div>
                            <motion.div variants={itemVariants} className="dashboard-column">
                                <DepartmentChart data={data} />
                            </motion.div>
                        </div>

                        <div className="dashboard-row">
                            <motion.div variants={itemVariants} className="dashboard-column">
                                <DeadlineList data={data} />
                            </motion.div>
                            <motion.div variants={itemVariants} className="dashboard-column">
                                <ObligationList data={data} />
                            </motion.div>
                            <motion.div variants={itemVariants} className="dashboard-column">
                                <Insights data={data} />
                            </motion.div>
                        </div>

                        <div className="dashboard-row" style={{ gridTemplateColumns: "1fr" }}>
                            <motion.div variants={itemVariants}>
                                <TaskCompletionPanel setActivePage={setActivePage} />
                            </motion.div>
                        </div>

                        <motion.div variants={itemVariants}>
                            <Pipeline />
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-panel empty-state-card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            textAlign: 'center',
                            marginTop: '20px'
                        }}
                    >
                        <h3 className="h3" style={{ marginBottom: '8px' }}>No Analysis Data Available</h3>
                        <p className="body" style={{ marginBottom: '24px' }}>Initialize the dashboard by uploading a regulatory document.</p>
                        <button className="btn btn-primary" onClick={() => setActivePage('Regulations')}>Upload Document</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}