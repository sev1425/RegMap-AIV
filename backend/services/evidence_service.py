import os
import re
from pathlib import Path

from werkzeug.utils import secure_filename

from ai.loader import UniversalDocumentLoader
from database.database import RegMapDatabase
from services.cko_utils import build_unified_dashboard


class EvidenceService:
    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".png", ".jpg", ".jpeg", ".txt"}

    def __init__(self):
        self.db = RegMapDatabase()
        self.upload_dir = Path(__file__).resolve().parents[1] / "uploads" / "evidence"
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_evidence_status(self):
        cko_data = self.db.get_latest_cko_json()
        if not cko_data:
            return {"status": "empty", "message": "No analysis found. Upload a regulation first."}

        dashboard = build_unified_dashboard(cko_data)
        evidence = dashboard.get("evidence", [])
        missing = [item for item in evidence if str(item.get("status", "")).lower() != "available"]

        return {
            "status": "success",
            "data": {
                "title": dashboard.get("title"),
                "evidence": evidence,
                "missing_evidence": missing,
                "readiness_score": dashboard.get("audit_readiness", 0),
                "approval_recommendation": self._approval_label(dashboard.get("audit_readiness", 0), len(missing)),
            }
        }

    def validate_file(self, file_storage):
        cko_data = self.db.get_latest_cko_json()
        if not cko_data:
            return {"status": "empty", "message": "Upload and analyze a regulation before validating evidence."}

        filename = secure_filename(file_storage.filename or "")
        extension = Path(filename).suffix.lower()
        if extension not in self.ALLOWED_EXTENSIONS:
            return {"status": "error", "message": "Unsupported evidence format."}

        filepath = self.upload_dir / filename
        file_storage.save(filepath)

        evidence_text = UniversalDocumentLoader(filepath).load()
        dashboard = build_unified_dashboard(cko_data)
        obligations = dashboard.get("obligations", [])
        validation = []

        for obligation in obligations:
            obligation_text = obligation.get("text", "")
            score, terms = self._match_score(obligation_text, evidence_text)
            if score >= 70:
                status = "Available"
            elif score >= 35:
                status = "Partial"
            else:
                status = "Missing"

            validation.append({
                "obligation_id": obligation.get("id"),
                "obligation": obligation_text,
                "department": obligation.get("department", "Compliance"),
                "status": status,
                "confidence": score,
                "matched_terms": terms[:8],
            })

        avg_confidence = round(sum(item["confidence"] for item in validation) / len(validation), 1) if validation else 0
        missing_count = sum(1 for item in validation if item["status"] == "Missing")

        return {
            "status": "success",
            "data": {
                "filename": filename,
                "confidence": avg_confidence,
                "validated_evidence": validation,
                "missing_evidence": [item for item in validation if item["status"] == "Missing"],
                "approval_recommendation": self._approval_label(avg_confidence, missing_count),
                "extracted_characters": len(evidence_text or ""),
            }
        }

    def _match_score(self, obligation_text, evidence_text):
        terms = {
            term.lower()
            for term in re.findall(r"[A-Za-z]{5,}", obligation_text or "")
            if term.lower() not in {"shall", "must", "required", "within", "compliance"}
        }
        if not terms:
            return 0, []

        evidence_lower = (evidence_text or "").lower()
        matched = sorted(term for term in terms if term in evidence_lower)
        score = round((len(matched) / len(terms)) * 100, 1)
        return score, matched

    def _approval_label(self, confidence, missing_count):
        if confidence >= 75 and missing_count == 0:
            return "Approve"
        if confidence >= 45:
            return "Conditional Approval"
        return "Reject"
