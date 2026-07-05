from flask import Blueprint, jsonify

from services.analytics_service import AnalyticsService


analytics_api = Blueprint("analytics_api", __name__)
analytics_service = AnalyticsService()


@analytics_api.route("/", methods=["GET"])
def get_analytics():
    try:
        return jsonify(analytics_service.get_analytics())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
