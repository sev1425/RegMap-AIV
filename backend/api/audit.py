# ==========================================================
# REGMAP AI ENTERPRISE
# AUDIT LOG API
# ==========================================================

from flask import Blueprint, jsonify
from database.database import RegMapDatabase

audit_api = Blueprint(
    "audit_api",
    __name__
)

db = RegMapDatabase()

@audit_api.route("/", methods=["GET"])
def get_audit():
    try:
        trail = db.get_audit_trail()
        return jsonify({
            "success": True,
            "data": trail
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500

@audit_api.route("/verify", methods=["GET"])
def verify_audit():
    try:
        is_valid, message = db.verify_chain()
        return jsonify({
            "success": True,
            "is_valid": is_valid,
            "message": message
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500
