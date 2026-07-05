from pathlib import Path

from database.database import RegMapDatabase
from services.cko_utils import build_unified_dashboard


class ReportService:
    def __init__(self):
        self.db = RegMapDatabase()
        self.backend_dir = Path(__file__).resolve().parents[1]

    def get_latest_report(self):
        cko_data = self.db.get_latest_cko_json()
        if not cko_data:
            return {"status": "empty", "message": "No report found. Upload a regulation first."}

        dashboard = build_unified_dashboard(cko_data)
        report = dashboard.get("enterprise_report", {})
        return {
            "status": "success",
            "data": {
                "report": report,
                "exports": report.get("exports", {}),
                "audit_readiness": dashboard.get("audit_readiness", 0),
            }
        }

    def get_export_path(self, export_format="pdf"):
        cko_data = self.db.get_latest_cko_json()
        if not cko_data:
            return None

        report = cko_data.get("enterprise_report", {}) or {}
        stored_path = (report.get("exports", {}) or {}).get(export_format)
        if not stored_path or str(stored_path).startswith("ERROR"):
            return None

        path = Path(stored_path)
        if not path.is_absolute():
            path = self.backend_dir / path

        return path if path.exists() else None
