from database.database import RegMapDatabase
from services.cko_utils import build_unified_dashboard


class AnalyticsService:
    def __init__(self):
        self.db = RegMapDatabase()

    def get_analytics(self):
        cko_data = self.db.get_latest_cko_json()
        if not cko_data:
            return {"status": "empty", "message": "No analysis found. Upload a regulation first."}

        dashboard = build_unified_dashboard(cko_data)
        analytics = dashboard.get("analytics", {})

        return {
            "status": "success",
            "data": {
                "title": dashboard.get("title"),
                "analytics": analytics,
                "kpis": analytics.get("compliance_kpi", {}),
                "department_risk": analytics.get("department_risk", {}),
                "risk_trend": analytics.get("risk_trend", []),
                "priority_breakdown": analytics.get("priority_breakdown", {}),
                "timeline_progress": analytics.get("timeline_progress", {}),
                "readiness_score": analytics.get("readiness_score", 0),
                "risks": dashboard.get("risks", []),
                "departments": dashboard.get("departments", []),
                "recommendations": dashboard.get("recommendations", []),
            }
        }
