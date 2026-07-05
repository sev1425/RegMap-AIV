# ==========================================================
# REGMAP AI ENTERPRISE
# ENTERPRISE ANALYTICS ENGINE
# ==========================================================
# Produces 6 chart-ready analytics objects:
#   1. department_risk     — Risk severity breakdown per department
#   2. risk_trend          — Score journey across pipeline stages
#   3. compliance_kpi      — Core KPI snapshot
#   4. priority_breakdown  — Recommendation priority distribution
#   5. timeline_progress   — Completion % across all activities
#   6. readiness_score     — Evidence-based readiness %
# ==========================================================

import time
from models.compliance import ComplianceKnowledgeObject


class EnterpriseAnalyticsEngine:

    def __init__(self):
        self.engine_name = "EnterpriseAnalyticsEngine"

    def analyze(self, cko: ComplianceKnowledgeObject) -> ComplianceKnowledgeObject:
        start_time = time.time()

        analytics = {
            "department_risk":    self._department_risk(cko),
            "risk_trend":         self._risk_trend(cko),
            "compliance_kpi":     self._compliance_kpi(cko),
            "priority_breakdown": self._priority_breakdown(cko),
            "timeline_progress":  self._timeline_progress(cko),
            "readiness_score":    self._readiness_score(cko),
        }

        # Also keep legacy keys so test_orchestrator's existing reads don't break
        analytics["risk_distribution"]  = self._risk_distribution(cko)
        analytics["graph_ready_json"]   = True

        cko.executive_dashboard["analytics"] = analytics

        elapsed = time.time() - start_time
        cko.processing_time += elapsed
        cko.engine_history = [
            e for e in cko.engine_history
            if not (isinstance(e, str) and self.engine_name in e)
        ]
        return cko

    # ----------------------------------------------------------
    # 1. Department Risk
    #    { "Treasury": {"High": 2, "Medium": 1, "Low": 0}, ... }
    # ----------------------------------------------------------
    def _department_risk(self, cko):
        result = {}
        for dept in cko.departments:
            name = dept.get("department", dept.get("name", "Unknown"))
            result[name] = {"High": 0, "Medium": 0, "Low": 0}

        for risk in cko.risks:
            source = risk.get("source", "")
            sev    = risk.get("severity", "Medium")
            matched = False
            for dept_name in list(result.keys()):
                if dept_name.lower() in source.lower():
                    result[dept_name][sev] = result[dept_name].get(sev, 0) + 1
                    matched = True
                    break
            if not matched:
                result.setdefault("General", {"High": 0, "Medium": 0, "Low": 0})
                result["General"][sev] = result["General"].get(sev, 0) + 1
        return result

    # ----------------------------------------------------------
    # 2. Risk Trend
    #    Score journey from Baseline → final compliance_score
    # ----------------------------------------------------------
    def _risk_trend(self, cko):
        base  = 100.0
        n_obl = len(cko.obligations)
        n_dl  = len(cko.deadlines)
        n_rsk = sum(1 for r in cko.risks if r.get("severity") == "High")
        n_cnf = len(cko.conflicts)
        n_ev  = sum(1 for e in cko.evidence if e.get("status") == "Available")

        after_obl = max(0, base  - n_obl * 8)
        after_dl  = max(0, after_obl - n_dl  * 5)
        after_rsk = max(0, after_dl  - n_rsk * 8)
        after_cnf = max(0, after_rsk - n_cnf * 6)
        recovered = min(after_cnf + n_ev * 3, 100)

        return [
            {"stage": "Baseline",              "score": base},
            {"stage": "After Obligation Analysis", "score": after_obl},
            {"stage": "After Deadline Analysis",   "score": after_dl},
            {"stage": "After Risk Assessment",     "score": after_rsk},
            {"stage": "After Conflict Detection",  "score": after_cnf},
            {"stage": "After Evidence Recovery",   "score": recovered},
        ]

    # ----------------------------------------------------------
    # 3. Compliance KPI
    # ----------------------------------------------------------
    def _compliance_kpi(self, cko):
        mandatory = sum(
            1 for o in cko.obligations
            if o.get("category", "").lower() == "mandatory"
        )
        return {
            "compliance_score":      round(cko.compliance_score, 1),
            "risk_score":            round(cko.risk_score, 1),
            "total_obligations":     len(cko.obligations),
            "mandatory_obligations": mandatory,
            "total_risks":           len(cko.risks),
            "high_risks":            sum(1 for r in cko.risks if r.get("severity") == "High"),
            "total_deadlines":       len(cko.deadlines),
            "total_departments":     len(cko.departments),
            "overall_risk":          cko.business_impact.get("overall_risk", "Unknown"),
        }

    # ----------------------------------------------------------
    # 4. Priority Breakdown
    # ----------------------------------------------------------
    def _priority_breakdown(self, cko):
        dist = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
        for rec in cko.recommendations:
            p = str(rec.get("priority", "Medium")).capitalize()
            dist[p] = dist.get(p, 0) + 1
        return dist

    # ----------------------------------------------------------
    # 5. Timeline Progress
    # ----------------------------------------------------------
    def _timeline_progress(self, cko):
        total     = len(cko.implementation_timeline)
        completed = sum(
            1 for t in cko.implementation_timeline
            if t.get("status", "").lower() == "completed"
        )
        pct = round((completed / total * 100), 1) if total > 0 else 0.0
        return {
            "total_tasks":           total,
            "completed":             completed,
            "completion_percentage": pct,
        }

    # ----------------------------------------------------------
    # 6. Readiness Score
    # ----------------------------------------------------------
    def _readiness_score(self, cko):
        total     = len(cko.evidence)
        available = sum(1 for e in cko.evidence if e.get("status") == "Available")
        if total == 0:
            return 50.0
        return round(available / total * 100, 1)

    # ----------------------------------------------------------
    # Legacy: Risk Distribution (kept for backwards compat)
    # ----------------------------------------------------------
    def _risk_distribution(self, cko):
        dist = {"High": 0, "Medium": 0, "Low": 0}
        for r in cko.risks:
            s = str(r.get("severity", "Medium")).capitalize()
            dist[s] = dist.get(s, 0) + 1
        return dist
