# ==========================================================
# REGMAP AI ENTERPRISE
# ANALYZE API
# ==========================================================

from flask import Blueprint
from flask import jsonify
from services.dashboard_service import DashboardService

analyze_api = Blueprint(
    "analyze_api",
    __name__
)

dashboard_service = DashboardService()


@analyze_api.route("/", methods=["GET"])
def analyze_status():

    return jsonify({

        "service": "Analyze API",

        "status": "Ready"

    })


@analyze_api.route("/latest", methods=["GET"])
def latest_analysis():
    try:
        return jsonify(dashboard_service.get_dashboard_data())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

from database.database import RegMapDatabase
from flask import request
import datetime

@analyze_api.route("/deploy-tasks", methods=["POST"])
def deploy_tasks():
    try:
        data = request.json
        task_ids = data.get("task_ids", [])
        
        db = RegMapDatabase()
        cko = db.get_latest_cko_json()
        if not cko:
            return jsonify({"status": "error", "message": "No analysis found"}), 404
            
        if "workflow" not in cko:
            cko["workflow"] = {
                "generated_tasks": [],
                "completed_tasks": [],
                "deployment_history": []
            }
            
        now = datetime.datetime.now().isoformat()

        # Keep the MAP Tracker in sync: marking a task as AI-resolved here
        # must also flip the matching MAP's status to "Complete" so the
        # Done/Pending split is consistent across Task Generator, MAP
        # Tracker, and the main Dashboard.
        maps = cko.get("maps", []) or []
        maps_by_obligation = {}
        for m in maps:
            maps_by_obligation.setdefault(m.get("obligation_id"), []).append(m)

        # We need to map task IDs back to obligations
        # For simplicity, since task generator passes obligation IDs, we'll just mark them resolved
        for task_id in task_ids:
            task_entry = {
                "task_id": f"TASK-{len(cko['workflow']['completed_tasks']) + 1}",
                "obligation_id": task_id,
                "status": "Completed",
                "completed_at": now,
                "created_at": now,
                "updated_at": now,
                "assigned_department": "AI Copilot"
            }
            cko["workflow"]["completed_tasks"].append(task_entry)
            cko["workflow"]["deployment_history"].append({
                "action": "AI Auto-Resolve",
                "task_id": task_entry["task_id"],
                "timestamp": now
            })

            # task_id from the frontend is the obligation id (e.g. OBL-003)
            # OR a MAP id directly (e.g. MAP-003) — handle both.
            matched_maps = list(maps_by_obligation.get(task_id, []))
            matched_maps += [m for m in maps if m.get("id") == task_id and m not in matched_maps]

            for m in matched_maps:
                old_status = m.get("status", "Pending")
                m["status"] = "Complete"
                m["ai_verified"] = True
                m["completed_at"] = now
                if old_status != "Complete":
                    m.setdefault("history", []).append({
                        "timestamp": now,
                        "from_status": old_status,
                        "to_status": "Complete",
                        "actor": "AI Copilot",
                        "note": "Auto-resolved by AI via Task Generator",
                    })

        cko["maps"] = maps
            
        # Update analytics: Increase readiness, lower risk score based on completed tasks
        if "enterprise_report" in cko and "readiness_score" in cko["enterprise_report"]:
            current_readiness = cko["enterprise_report"]["readiness_score"]
            cko["enterprise_report"]["readiness_score"] = min(100, current_readiness + len(task_ids) * 2)
            
        if "executive_dashboard" in cko and "readiness_score" in cko["executive_dashboard"]:
            current_readiness = cko["executive_dashboard"]["readiness_score"]
            cko["executive_dashboard"]["readiness_score"] = min(100, current_readiness + len(task_ids) * 2)
            
        db.update_latest_cko_json(cko)
        
        return jsonify({
            "status": "success",
            "message": f"Deployed {len(task_ids)} tasks successfully"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
