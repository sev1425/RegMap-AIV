import "./KPIGrid.css";
import StatCard from "../cards/StatCard";

export default function KPIGrid({ data }) {
    if (!data) return null;

    const kpi = data.analytics?.compliance_kpi || {};

    // These now come straight from the backend, computed fresh from the
    // real MAP status every time the dashboard is fetched — so they
    // reflect resolutions made via MAP Tracker OR Task Generator's AI
    // auto-resolve, and they survive a page reload (unlike a client-only
    // memory flag).
    const baseCompliance = data.compliance_score || 0;
    const totalHighRisks = kpi.high_risks || 0;
    const resolvedHighRisks = kpi.resolved_high_risks || 0;
    const pendingHighRisks = kpi.pending_high_risks ?? Math.max(0, totalHighRisks - resolvedHighRisks);

    const totalObligations = kpi.total_obligations || 0;
    const resolvedObligations = kpi.resolved_obligations || 0;
    const pendingObligations = kpi.pending_obligations ?? Math.max(0, totalObligations - resolvedObligations);

    const completionPct = data.analytics?.timeline_progress?.completion_percentage ?? kpi.map_completion_percentage ?? 0;
    const totalMaps = kpi.total_maps || 0;
    const completedMaps = kpi.completed_maps || 0;

    // Compliance score nudged upward by remediation progress — capped at 100.
    const complianceDisplay = totalMaps > 0
        ? Math.min(100, Math.round(baseCompliance + (completedMaps / totalMaps) * (100 - baseCompliance) * 0.5))
        : Math.round(baseCompliance);

    const riskProgress = totalHighRisks > 0
        ? Math.round((pendingHighRisks / totalHighRisks) * 100)
        : 0;

    return (
        <section className="kpi-grid">
            <StatCard
                type="compliance"
                title="Compliance Score"
                value={complianceDisplay.toString()}
                subtitle="Overall regulatory health score."
                progress={complianceDisplay}
                color="#22c55e"
                trend={completedMaps > 0 ? `+${complianceDisplay - Math.round(baseCompliance)}%` : undefined}
            />
            <StatCard
                type="risk"
                title="High Risks"
                value={pendingHighRisks.toString()}
                subtitle={resolvedHighRisks > 0 ? `${resolvedHighRisks} resolved.` : "Immediate attention required."}
                progress={riskProgress}
                color="#ef4444"
                trend={resolvedHighRisks > 0 ? `-${resolvedHighRisks}` : undefined}
            />
            <StatCard
                type="obligation"
                title="Obligations"
                value={pendingObligations.toString()}
                subtitle="Mandatory and advisory."
                progress={totalObligations > 0 ? Math.round((pendingObligations / totalObligations) * 100) : 0}
                color="#2563eb"
                trend={resolvedObligations > 0 ? `-${resolvedObligations}` : undefined}
            />
            <StatCard
                type="progress"
                title="Completion"
                value={`${Math.round(completionPct)}%`}
                subtitle={totalMaps > 0 ? `${completedMaps} of ${totalMaps} MAPs done.` : "Implementation progress."}
                progress={completionPct}
                color="#8b5cf6"
                trend={completedMaps > 0 ? `+${completedMaps}` : undefined}
            />
        </section>
    );
}
