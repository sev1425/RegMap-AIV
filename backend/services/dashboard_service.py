# ==========================================================
# REGMAP AI ENTERPRISE
# DASHBOARD SERVICE
# ==========================================================

from database.database import RegMapDatabase
from services.cko_utils import build_unified_dashboard

class DashboardService:

    def __init__(self):
        self.db = RegMapDatabase()
        
    def get_dashboard_data(self):
        """
        Retrieves the unified dashboard JSON.
        Checks the database for the latest analysis.
        If none exists, runs the orchestrator on a sample text to initialize the dashboard.
        """
        analyses = self.db.get_all_analyses()
        
        if analyses and len(analyses) > 0:
            # analyses is a list of tuples:
            # (id, title, compliance_score, overall_risk, confidence, executive_dashboard, created_at)
            latest_analysis = analyses[-1] 
            cko_data = self.db.get_latest_cko_json()
            if cko_data:
                return {
                    "status": "success",
                    "data": build_unified_dashboard(cko_data)
                }
                
        # If no analysis exists
        return {
            "status": "empty",
            "message": "No data available. Please upload a document to begin."
        }
