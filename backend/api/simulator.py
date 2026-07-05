# ==========================================================
# REGMAP AI ENTERPRISE
# IMPACT SIMULATOR API
# ==========================================================

from flask import Blueprint, jsonify, request
from services.simulator_service import SimulatorService

simulator_api = Blueprint("simulator_api", __name__)
simulator_service = SimulatorService()


@simulator_api.route("/", methods=["GET"])
def simulator_status():
    return jsonify({"service": "Impact Simulator API", "status": "Ready"})


@simulator_api.route("/baseline", methods=["GET"])
def get_baseline():
    """Return the current state for the simulator to start from."""
    try:
        result = simulator_service.get_baseline()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@simulator_api.route("/simulate", methods=["POST"])
def simulate():
    """Run a simulation with parameter overrides."""
    data = request.json or {}
    try:
        result = simulator_service.simulate(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
