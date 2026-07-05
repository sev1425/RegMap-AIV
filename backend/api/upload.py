# ==========================================================
# REGMAP AI ENTERPRISE
# DOCUMENT UPLOAD API
# ==========================================================

import os
from pathlib import Path

from flask import Blueprint
from flask import request
from flask import jsonify

from werkzeug.utils import secure_filename

from services.analysis_service import AnalysisService
from services.cko_utils import cko_to_dict, build_unified_dashboard


upload_api = Blueprint(
    "upload_api",
    __name__
)

analysis_service = AnalysisService()
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".png", ".jpg", ".jpeg", ".txt"}
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def allowed_file(filename):
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


@upload_api.route("/", methods=["POST"])

def upload_document():

    if "file" not in request.files:

        return jsonify({

            "success": False,

            "message": "No file uploaded."

        }), 400

    file = request.files["file"]

    if file.filename == "":

        return jsonify({

            "success": False,

            "message": "No selected file."

        }), 400

    if not allowed_file(file.filename):

        return jsonify({

            "success": False,

            "message": "Unsupported file."

        }), 400

    filename = secure_filename(file.filename)

    filepath = UPLOAD_DIR / filename

    file.save(filepath)

    try:
        cko = analysis_service.analyze_document(str(filepath), source_filename=filename)
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": f"Document analysis failed: {str(exc)}"
        }), 500

    return jsonify({
        "success": True,
        "filename": filename,
        "data": build_unified_dashboard(cko_to_dict(cko))
    })


@upload_api.route("/text", methods=["POST"])
def upload_text():
    """Accept raw circular text directly — no file needed."""
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"success": False, "message": "No text provided."}), 400
    if len(text) < 50:
        return jsonify({"success": False, "message": "Text too short to analyse."}), 400

    # Write to a temp file so AnalysisService can handle it uniformly
    import tempfile, os
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False,
                                     dir=str(UPLOAD_DIR), encoding="utf-8") as tmp:
        tmp.write(text)
        tmp_path = tmp.name

    try:
        cko = analysis_service.analyze_document(tmp_path)
    except Exception as exc:
        return jsonify({"success": False, "message": f"Analysis failed: {str(exc)}"}), 500
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    from services.cko_utils import cko_to_dict, build_unified_dashboard
    cko_dict = cko_to_dict(cko)
    return jsonify({
        "success": True,
        "filename": "pasted_circular.txt",
        "data": build_unified_dashboard(cko_dict),
        "maps": cko_dict.get("maps", []),
    })
