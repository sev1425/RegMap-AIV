from database.database import RegMapDatabase
from services.cko_utils import build_unified_dashboard, readiness_score


class TimelineService:
    def __init__(self):
        self.db = RegMapDatabase()

    def get_timeline(self):
        cko_data = self.db.get_latest_cko_json()
        if not cko_data:
            return {"status": "empty", "message": "No analysis found. Upload a regulation first."}

        dashboard = build_unified_dashboard(cko_data)
        evidence = dashboard.get("evidence", [])
        missing = [item for item in evidence if str(item.get("status", "")).lower() != "available"]
        timeline = dashboard.get("implementation_timeline", [])
        deadlines = dashboard.get("deadlines", [])

        return {
            "status": "success",
            "data": {
                "title": dashboard.get("title"),
                "audit_readiness": readiness_score(evidence),
                "timeline": timeline,
                "implementation_timeline": timeline,
                "deadlines": deadlines,
                "missing_evidence": missing,
                "recommendations": dashboard.get("recommendations", []),
                "summary": dashboard.get("enterprise_report", {}).get("audit_summary", ""),
            }
        }
