# ==========================================================
# REGMAP AI ENTERPRISE
# CONFLICT DETECTOR SERVICE
# ==========================================================

import json
from database.database import RegMapDatabase
from ai.comparison_engine import RegulationComparisonEngine
from ai.conflict_engine import ConflictEngine
from models.compliance import ComplianceKnowledgeObject


class ConflictService:

    def __init__(self):
        self.db = RegMapDatabase()
        self.comparison_engine = RegulationComparisonEngine()

    def _build_cko_from_dict(self, data: dict) -> ComplianceKnowledgeObject:
        cko = ComplianceKnowledgeObject()
        for field, value in data.items():
            if hasattr(cko, field):
                setattr(cko, field, value)
        return cko

    def get_all_analyses_summary(self):
        """Returns a list of stored analyses with id and title for selection."""
        rows = self.db.get_all_analyses()
        result = []
        for row in rows:
            # row: (id, title, compliance_score, overall_risk, confidence,
            #       executive_dashboard, cko_json, created_at)
            result.append({
                "id": row[0],
                "title": row[1] or f"Document #{row[0]}",
                "compliance_score": row[2],
                "overall_risk": row[3],
                "created_at": row[7] if len(row) > 7 else None
            })
        return result

    def compare(self, id_a: int, id_b: int) -> dict:
        """
        Compare two stored analyses by their DB ids.
        Returns a conflict comparison report.
        """
        rows = self.db.get_all_analyses()
        row_map = {row[0]: row for row in rows}

        if id_a not in row_map or id_b not in row_map:
            return {"status": "error", "message": "One or both analysis IDs not found."}

        def load_cko(row):
            # Try cko_json first
            cko_json_str = row[6] if len(row) > 7 else None
            if cko_json_str:
                try:
                    data = json.loads(cko_json_str)
                    return self._build_cko_from_dict(data)
                except Exception:
                    pass
            # Fallback: build partial CKO from executive_dashboard
            cko = ComplianceKnowledgeObject()
            cko.title = row[1] or "Unknown"
            try:
                ed = json.loads(row[5])
                cko.executive_dashboard = ed
            except Exception:
                pass
            return cko

        cko_a = load_cko(row_map[id_a])
        cko_b = load_cko(row_map[id_b])

        report = self.comparison_engine.compare(cko_a, cko_b)

        # Enrich with severity scoring
        report["conflict_severity"] = self._score_severity(report)
        report["status"] = "success"
        return report

    def get_internal_conflicts(self) -> dict:
        """Returns the internal conflicts already detected in the latest analysis."""
        rows = self.db.get_all_analyses()
        if not rows:
            return {"status": "empty", "conflicts": []}

        latest = rows[-1]
        cko_json_str = latest[6] if len(latest) > 7 else None

        if not cko_json_str:
            return {"status": "empty", "conflicts": []}

        try:
            data = json.loads(cko_json_str)
            conflicts = data.get("conflicts", [])
            recommendations = data.get("recommendations", [])
            return {
                "status": "success",
                "document_title": latest[1] or "Unknown",
                "conflicts": conflicts,
                "recommendations": recommendations[:5]
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _score_severity(self, report: dict) -> str:
        added = len(report.get("added_obligations", []))
        removed = len(report.get("removed_obligations", []))
        modified = len(report.get("modified_obligations", []))
        total = added + removed + modified
        if total >= 5:
            return "Critical"
        elif total >= 3:
            return "High"
        elif total >= 1:
            return "Medium"
        return "Low"
