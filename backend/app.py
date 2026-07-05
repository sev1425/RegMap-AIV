# ==========================================================
# REGMAP AI ENTERPRISE
# MAIN APPLICATION
# ==========================================================

from flask import Flask, jsonify
from flask_cors import CORS

# ==========================================================
# Import APIs
# ==========================================================

from api.upload import upload_api
from api.analyze import analyze_api
from api.dashboard import dashboard_api
from api.reports import reports_api
from api.timeline import timeline_api
from api.copilot import copilot_api
from api.graph import graph_api
from api.conflict import conflict_api
from api.simulator import simulator_api
from api.analytics import analytics_api
from api.evidence import evidence_api
from api.audit import audit_api
from api.maps import maps_api

# ==========================================================
# Flask App
# ==========================================================

app = Flask(__name__)

CORS(app)

# ==========================================================
# Configuration
# ==========================================================

app.config["UPLOAD_FOLDER"] = "uploads"

app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024   # 50 MB

# ==========================================================
# Register APIs
# ==========================================================

app.register_blueprint(upload_api, url_prefix="/api/upload")

app.register_blueprint(analyze_api, url_prefix="/api/analyze")

app.register_blueprint(dashboard_api, url_prefix="/api/dashboard")

app.register_blueprint(reports_api, url_prefix="/api/reports")
app.register_blueprint(timeline_api, url_prefix="/api/timeline")
app.register_blueprint(copilot_api, url_prefix="/api/copilot")
app.register_blueprint(graph_api, url_prefix="/api/graph")
app.register_blueprint(conflict_api, url_prefix="/api/conflict")
app.register_blueprint(simulator_api, url_prefix="/api/simulator")
app.register_blueprint(analytics_api, url_prefix="/api/analytics")
app.register_blueprint(evidence_api, url_prefix="/api/evidence")
app.register_blueprint(audit_api, url_prefix="/api/audit")
app.register_blueprint(maps_api, url_prefix="/api/maps")

# ==========================================================
# Home
# ==========================================================

@app.route("/")

def home():

    return jsonify({

        "application": "RegMap AI Enterprise",

        "version": "2.0",

        "status": "Running"

    })

# ==========================================================
# Health Check
# ==========================================================

@app.route("/health")

def health():

    return jsonify({

        "status": "Healthy",

        "database": "Connected",

        "ai_engine": "Ready"

    })

# ==========================================================
# Start Server
# ==========================================================

if __name__ == "__main__":

    import os
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"

    app.run(

        debug=debug_mode,

        host="0.0.0.0",

        port=5000

    )
