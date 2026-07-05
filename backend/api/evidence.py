from flask import Blueprint, jsonify, request

from services.evidence_service import EvidenceService


evidence_api = Blueprint("evidence_api", __name__)
evidence_service = EvidenceService()


@evidence_api.route("/", methods=["GET"])
def get_evidence_status():
    try:
        return jsonify(evidence_service.get_evidence_status())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@evidence_api.route("/validate", methods=["POST"])
def validate_evidence():
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No evidence file uploaded."}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"status": "error", "message": "No selected evidence file."}), 400

    try:
        result = evidence_service.validate_file(file)
        status_code = 400 if result.get("status") == "error" else 200
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
