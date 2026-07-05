from pathlib import Path

from flask import Blueprint, jsonify, request, send_file

from database.database import RegMapDatabase
from ai.report_engine import EnterpriseReportEngine
from services.report_service import ReportService

reports_api = Blueprint("reports_api", __name__)

report_service = ReportService()
_db = RegMapDatabase()
_engine = EnterpriseReportEngine()


@reports_api.route("/", methods=["GET"])
def get_reports():
    try:
        return jsonify(report_service.get_latest_report())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def _build_latest_enterprise_report_from_db():
    """Generate enterprise report + exports for latest DB CKO.

    Returns the generated enterprise_report dict (including `exports`).
    """
    cko_data = _db.get_latest_cko_json()
    if not cko_data or not isinstance(cko_data, dict):
        return None

    from models.compliance import ComplianceKnowledgeObject

    # Build dataclass from stored dict. If stored dict has keys outside the
    # dataclass fields, dataclass init will fail; fall back to setattr merge.
    try:
        cko = ComplianceKnowledgeObject(**cko_data)
    except TypeError:
        cko = ComplianceKnowledgeObject()
        for k, v in cko_data.items():
            if hasattr(cko, k):
                setattr(cko, k, v)

    cko = _engine.analyze(cko)

    if not hasattr(cko, "enterprise_report") or not isinstance(cko.enterprise_report, dict):
        return None

    exports = cko.enterprise_report.get("exports") or {}
    if not exports:
        # Fallback: run exporter again on the enterprise_report payload.
        # This is defensive in case analyze() didn't embed export paths.
        try:
            from reports.export_service import ReportExportService

            exporter = ReportExportService(export_dir="uploads/exports")
            payload = dict(cko.enterprise_report)
            prefix = (payload.get("document", {}) or {}).get("title") or "EnterpriseReport"
            prefix = str(prefix)[:30].replace(" ", "_")

            json_path = exporter.export_json(payload, filename_prefix=prefix)
            pdf_path = exporter.export_pdf(payload, filename_prefix=prefix)
            cko.enterprise_report["exports"] = {"json": json_path, "pdf": pdf_path}
        except Exception:
            pass

    return cko.enterprise_report


@reports_api.route("/download", methods=["GET"])
def download_report():
    export_format = request.args.get("format", "pdf").lower()
    if export_format not in {"pdf", "json"}:
        return jsonify({"status": "error", "message": "format must be pdf or json."}), 400

    # Fast path: already exported
    path = report_service.get_export_path(export_format)

    # Slow path: generate on-demand
    if not path and export_format == "pdf":
        enterprise_report = _build_latest_enterprise_report_from_db()
        if enterprise_report and isinstance(enterprise_report, dict):
            exports = enterprise_report.get("exports") or {}
            maybe_path = exports.get("pdf")
            if maybe_path:
                p = Path(str(maybe_path))
                if not p.is_absolute():
                    p = report_service.backend_dir / p
                if p.exists():
                    path = p

    if not path and export_format == "pdf":
        # If on-demand generation failed to produce a real file, surface the underlying issue.
        # This prevents endless 404s and makes debugging export failures much easier.
        try:
            enterprise_report = _build_latest_enterprise_report_from_db()
            exports = (enterprise_report or {}).get("exports") or {}
            return jsonify({
                "status": "error",
                "message": "PDF generation attempted but no valid PDF file was produced.",
                "exports": exports,
            }), 500
        except Exception as e:
            return jsonify({"status": "error", "message": f"PDF not available: {e}"}), 500

    if not path:
        return jsonify({"status": "empty", "message": "No exported report is available yet."}), 404

    return send_file(path, as_attachment=True)


