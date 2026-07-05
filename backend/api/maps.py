# ==========================================================
# REGMAP AI ENTERPRISE
# MAPS API — Measurable Action Points
# ==========================================================

from flask import Blueprint, jsonify, request
from database.database import RegMapDatabase

maps_api = Blueprint("maps_api", __name__)


@maps_api.route("/", methods=["GET"])
def get_maps():
    """Return all MAPs for the latest analysis."""
    try:
        db = RegMapDatabase()
        cko = db.get_latest_cko_json()
        if not cko:
            return jsonify({"success": False, "message": "No analysis found. Upload a circular first."}), 404
        maps = cko.get("maps", [])
        done_count = sum(1 for m in maps if m.get("status") == "Complete")
        pending_count = sum(1 for m in maps if m.get("status") in ("Pending", "In Progress", "Under Review"))
        return jsonify({
            "success": True,
            "count": len(maps),
            "maps": maps,
            "recommendations": cko.get("recommendations", []),
            "summary": {
                "total":       len(maps),
                "critical":    sum(1 for m in maps if m.get("priority") == "Critical"),
                "high":        sum(1 for m in maps if m.get("priority") == "High"),
                "medium":      sum(1 for m in maps if m.get("priority") == "Medium"),
                "low":         sum(1 for m in maps if m.get("priority") == "Low"),
                "pending":     sum(1 for m in maps if m.get("status") == "Pending"),
                "in_progress": sum(1 for m in maps if m.get("status") == "In Progress"),
                "under_review":sum(1 for m in maps if m.get("status") == "Under Review"),
                "complete":    done_count,
                "done":        done_count,
                "not_done":    pending_count,
                "ai_verified": sum(1 for m in maps if m.get("ai_verified")),
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@maps_api.route("/<map_id>/status", methods=["PATCH"])
def update_map_status(map_id):
    """Update the status of a specific MAP (Pending/In Progress/Complete)."""
    try:
        data = request.get_json(silent=True) or {}
        new_status = data.get("status", "Pending")
        allowed = {"Pending", "In Progress", "Under Review", "Complete"}
        if new_status not in allowed:
            return jsonify({"success": False, "message": f"Invalid status. Use: {allowed}"}), 400

        db = RegMapDatabase()
        cko = db.get_latest_cko_json()
        if not cko:
            return jsonify({"success": False, "message": "No analysis found."}), 404

        maps = cko.get("maps", [])
        updated = False
        import datetime
        now = datetime.datetime.now().isoformat()
        for m in maps:
            if m.get("id") == map_id:
                old_status = m.get("status", "Pending")
                m["status"] = new_status
                if new_status == "Complete":
                    m["completed_at"] = m.get("completed_at") or now
                else:
                    m["completed_at"] = None
                    m["ai_verified"] = False

                if old_status != new_status:
                    m.setdefault("history", []).append({
                        "timestamp": now,
                        "from_status": old_status,
                        "to_status": new_status,
                        "actor": "User",
                        "note": f"Status changed from {old_status} to {new_status}",
                    })
                updated = True
                break

        if not updated:
            return jsonify({"success": False, "message": f"MAP {map_id} not found."}), 404

        cko["maps"] = maps
        db.update_latest_cko_json(cko)
        return jsonify({"success": True, "map_id": map_id, "status": new_status})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@maps_api.route("/history", methods=["GET"])
def get_maps_history():
    """Return a flattened, time-sorted activity log across all MAPs."""
    try:
        db = RegMapDatabase()
        cko = db.get_latest_cko_json()
        if not cko:
            return jsonify({"success": False, "message": "No analysis found.", "events": []}), 404

        maps = cko.get("maps", [])
        events = []
        for m in maps:
            for h in (m.get("history") or []):
                events.append({
                    "map_id": m.get("id"),
                    "department": m.get("department"),
                    "obligation_text": m.get("obligation_text"),
                    "timestamp": h.get("timestamp"),
                    "from_status": h.get("from_status"),
                    "to_status": h.get("to_status"),
                    "actor": h.get("actor", "User"),
                    "note": h.get("note", ""),
                })
        events.sort(key=lambda e: e.get("timestamp") or "", reverse=True)

        return jsonify({"success": True, "count": len(events), "events": events})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@maps_api.route("/department/<department>", methods=["GET"])
def get_maps_by_department(department):
    """Filter MAPs by department."""
    try:
        db = RegMapDatabase()
        cko = db.get_latest_cko_json()
        if not cko:
            return jsonify({"success": False, "message": "No analysis found."}), 404
        maps = [m for m in cko.get("maps", []) if department.lower() in m.get("department", "").lower()]
        return jsonify({"success": True, "department": department, "count": len(maps), "maps": maps})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
