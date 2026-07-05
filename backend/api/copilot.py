# ==========================================================
# REGMAP AI ENTERPRISE
# COPILOT API
# ==========================================================

from flask import Blueprint, jsonify, request
from services.copilot_service import CopilotService

copilot_api = Blueprint("copilot_api", __name__)

copilot_service = CopilotService()


@copilot_api.route("/", methods=["GET"])
def copilot_status():
    return jsonify({
        "service": "AI Copilot API",
        "status": "Ready",
        "description": "Offline AI Copilot powered by RegMap Intelligence Engines"
    })


@copilot_api.route("/query", methods=["POST"])
def query():
    data = request.json or {}
    user_query = data.get("query", "").strip()
    session_id = data.get("session_id", "default")
    
    # We will fetch history from DB instead of relying on frontend
    history = copilot_service.db.get_conversation(session_id)

    if not user_query:
        return jsonify({
            "status": "error",
            "message": "Query cannot be empty."
        }), 400

    try:
        # Save user message to DB
        copilot_service.db.save_message(session_id, "user", user_query)
        
        result = copilot_service.query(user_query, history)
        
        # Save assistant message to DB
        copilot_service.db.save_message(session_id, "assistant", result.get("response", ""))
        
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@copilot_api.route("/history", methods=["GET"])
def get_history():
    session_id = request.args.get("session_id", "default")
    try:
        history = copilot_service.db.get_conversation(session_id)
        return jsonify({"status": "success", "history": history})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@copilot_api.route("/clear", methods=["POST"])
def clear_history():
    data = request.json or {}
    session_id = data.get("session_id", "default")
    try:
        copilot_service.db.clear_conversation(session_id)
        return jsonify({"status": "success", "message": "Conversation cleared."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
