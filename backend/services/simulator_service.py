# ==========================================================
# REGMAP AI ENTERPRISE
# IMPACT SIMULATOR SERVICE
# ==========================================================

import json
from database.database import RegMapDatabase
from ai.decision_engine import DecisionEngine
from models.compliance import ComplianceKnowledgeObject


class SimulatorService:

    def __init__(self):
        self.db = RegMapDatabase()
        self.decision_engine = DecisionEngine()

    def _build_cko_from_dict(self, data: dict) -> ComplianceKnowledgeObject:
        cko = ComplianceKnowledgeObject()
        for field, value in data.items():
            if hasattr(cko, field):
                setattr(cko, field, value)
        return cko

    def get_baseline(self) -> dict:
        """
        Returns the baseline state of the latest CKO for the simulator.
        """
        rows = self.db.get_all_analyses()
        if not rows:
            return {"status": "empty", "message": "No analysis found. Please upload a document first."}

        latest = rows[-1]
        cko_json_str = latest[6] if len(latest) > 7 else None

        if not cko_json_str:
            return {"status": "empty", "message": "No CKO data found in the latest analysis."}

        try:
            data = json.loads(cko_json_str)
            return {
                "status": "success",
                "title": latest[1] or "Unknown",
                "compliance_score": data.get("compliance_score", 0),
                "risk_score": data.get("risk_score", 0),
                "priority": data.get("priority", "Low"),
                "obligations": data.get("obligations", []),
                "deadlines": data.get("deadlines", []),
                "departments": data.get("departments", []),
                "risks": data.get("risks", []),
                "recommendations": data.get("recommendations", []),
                "implementation_timeline": data.get("implementation_timeline", [])
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def simulate(self, overrides: dict) -> dict:
        """
        Recalculates compliance scores based on user-defined parameter overrides.
        overrides can include:
          - added_obligations: int
          - removed_obligations: int
          - deadline_extension_days: int (positive = extended, negative = tightened)
          - priority_override: str (Low/Medium/High/Critical)
          - risk_mitigation: int (number of risks to be resolved)
        """
        rows = self.db.get_all_analyses()
        if not rows:
            return {"status": "empty", "message": "No analysis found."}

        latest = rows[-1]
        cko_json_str = latest[6] if len(latest) > 7 else None

        if not cko_json_str:
            return {"status": "empty", "message": "No CKO data available."}

        data = json.loads(cko_json_str)
        cko = self._build_cko_from_dict(data)

        # Apply overrides
        added = int(overrides.get("added_obligations", 0))
        removed = int(overrides.get("removed_obligations", 0))
        risk_mitigation = int(overrides.get("risk_mitigation", 0))
        priority_override = overrides.get("priority_override", None)

        # Modify CKO for simulation
        obligations_count = max(0, len(cko.obligations) + added - removed)
        risks_count = max(0, len(cko.risks) - risk_mitigation)
        deadline_count = len(cko.deadlines)

        # Recalculate score using same decision engine logic
        simulated_score = 100
        simulated_score -= obligations_count * 10
        simulated_score -= deadline_count * 5
        simulated_score -= risks_count * 3
        simulated_score = max(0, min(100, simulated_score))

        # Recalculate priority
        mandatory_count = sum(1 for o in cko.obligations if o.get("category") == "Mandatory")
        mandatory_count = max(0, mandatory_count + added - removed)

        if priority_override:
            simulated_priority = priority_override
        elif mandatory_count >= 5:
            simulated_priority = "Critical"
        elif mandatory_count >= 3:
            simulated_priority = "High"
        elif mandatory_count >= 1:
            simulated_priority = "Medium"
        else:
            simulated_priority = "Low"

        baseline_score = data.get("compliance_score", 0)
        score_delta = round(simulated_score - baseline_score, 1)

        # Department impact
        dept_impact = []
        for dept in cko.departments[:6]:
            name = dept.get("department", dept.get("name", "Unknown"))
            dept_impact.append({
                "department": name,
                "impact": "High" if added > 0 else "Low",
                "obligation_count": dept.get("obligation_count", obligations_count)
            })

        return {
            "status": "success",
            "baseline_score": baseline_score,
            "simulated_score": round(simulated_score, 1),
            "score_delta": score_delta,
            "baseline_priority": data.get("priority", "Low"),
            "simulated_priority": simulated_priority,
            "simulated_obligations": obligations_count,
            "simulated_risks": risks_count,
            "department_impact": dept_impact,
            "overrides_applied": overrides
        }
