# ==========================================================
# REGMAP AI ENTERPRISE
# CONFLICT DETECTOR API
# ==========================================================

from flask import Blueprint, jsonify, request
from services.conflict_service import ConflictService

conflict_api = Blueprint("conflict_api", __name__)
conflict_service = ConflictService()


@conflict_api.route("/", methods=["GET"])
def conflict_status():
    return jsonify({"service": "Conflict Detector API", "status": "Ready"})


@conflict_api.route("/internal", methods=["GET"])
def get_internal_conflicts():
    """Return conflicts already detected inside the latest uploaded document."""
    try:
        result = conflict_service.get_internal_conflicts()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@conflict_api.route("/analyses", methods=["GET"])
def get_analyses():
    """Return a list of all stored analyses for comparison selection."""
    try:
        analyses = conflict_service.get_all_analyses_summary()
        return jsonify({"status": "success", "analyses": analyses})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@conflict_api.route("/compare", methods=["POST"])
def compare():
    """Compare two analyses by ID."""
    data = request.json or {}
    id_a = data.get("id_a")
    id_b = data.get("id_b")

    if id_a is None or id_b is None:
        return jsonify({"status": "error", "message": "id_a and id_b are required."}), 400

    try:
        result = conflict_service.compare(int(id_a), int(id_b))
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
