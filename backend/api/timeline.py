from flask import Blueprint, jsonify
from services.timeline_service import TimelineService

timeline_api = Blueprint("timeline_api", __name__)
timeline_service = TimelineService()

@timeline_api.route("/", methods=["GET"])
def get_timeline():
    try:
        return jsonify(timeline_service.get_timeline())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
