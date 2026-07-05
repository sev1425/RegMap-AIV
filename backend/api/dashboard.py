# ==========================================================
# REGMAP AI ENTERPRISE
# DASHBOARD API
# ==========================================================

from flask import Blueprint, jsonify
from services.dashboard_service import DashboardService

dashboard_api = Blueprint(
    "dashboard_api",
    __name__
)

dashboard_service = DashboardService()

@dashboard_api.route("/", methods=["GET"])
def get_dashboard():
    try:
        result = dashboard_service.get_dashboard_data()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500