from flask import Blueprint, jsonify
from services.graph_service import GraphService

graph_api = Blueprint("graph_api", __name__)
graph_service = GraphService()

@graph_api.route("/", methods=["GET"])
def get_graph():
    try:
        return jsonify(graph_service.get_graph())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
