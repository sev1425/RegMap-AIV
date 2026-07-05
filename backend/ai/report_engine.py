import time
import os
from datetime import datetime
from typing import Dict, Any
from models.compliance import ComplianceKnowledgeObject


class EnterpriseReportEngine:
    """
    Enterprise Report Engine
    Generates an enterprise-grade compliance report containing executive summaries,
    KPIs, board summaries, audit summaries, and physically exports JSON + PDF files.
    """

    def __init__(self):
        self.engine_name = "EnterpriseReportEngine"

        # Lazy-import to avoid circular deps; instantiated once
        from reports.export_service import ReportExportService
        self.exporter = ReportExportService(export_dir="uploads/exports")

    def analyze(self, cko: ComplianceKnowledgeObject) -> ComplianceKnowledgeObject:
        start_time = time.time()

        compliance_kpis = self._generate_kpis(cko)

        enterprise_report = {
            "report_information": {
                "generated_on": datetime.utcnow().strftime("%d-%m-%Y %H:%M:%S"),
                "report_type":  "Enterprise Compliance Assessment",
                "version":      "1.0",
            },
            "document": {
                "title":  cko.title  if cko.title  else "Compliance Document",
                "issuer": cko.issuer,
                "type":   cko.document_type,
            },
            "executive_summary":    self._generate_executive_summary(cko, compliance_kpis),
            "compliance_kpis":      compliance_kpis,
            "entities":             cko.entities,
            "obligations":          cko.obligations,
            "deadlines":            cko.deadlines,
            "departments":          cko.departments,
            "risks":                cko.risks,
            "evidence":             cko.evidence,
            "conflicts":            cko.conflicts,
            "recommendations":      cko.recommendations,
            "knowledge_graph_summary": cko.knowledge_graph,
            "business_impact":      cko.business_impact,
            "metadata":             cko.metadata,
            "executive_notes":      self._generate_executive_notes(cko),
            "board_summary":        self._generate_board_summary(cko, compliance_kpis),
            "audit_summary":        self._generate_audit_summary(cko),
        }

        # ──────────────────────────────────────────────────
        # Export JSON + PDF and embed paths back into report
        # ──────────────────────────────────────────────────
        prefix = (cko.title[:30].replace(" ", "_") if cko.title else "EnterpriseReport")

        try:
            json_path = self.exporter.export_json(enterprise_report, filename_prefix=prefix)
        except Exception as e:
            json_path = f"ERROR: {e}"

        try:
            pdf_path = self.exporter.export_pdf(enterprise_report, filename_prefix=prefix)
        except Exception as e:
            pdf_path = f"ERROR: {e}"

        enterprise_report["exports"] = {
            "json": json_path,
            "pdf":  pdf_path,
        }

        cko.enterprise_report = enterprise_report

        elapsed_time = time.time() - start_time
        cko.processing_time += elapsed_time

        # Remove any legacy string entry so pipeline can write structured dict
        cko.engine_history = [
            e for e in cko.engine_history
            if not (isinstance(e, str) and self.engine_name in e)
        ]

        print(
            f"[AI] Enterprise Report Engine Completed "
            f"| JSON: {os.path.basename(json_path) if not json_path.startswith('ERROR') else json_path} "
            f"| PDF: {os.path.basename(pdf_path) if not pdf_path.startswith('ERROR') else pdf_path}"
        )
        return cko

    # ──────────────────────────────────────────────────────
    # KPIs
    # ──────────────────────────────────────────────────────
    def _generate_kpis(self, cko: ComplianceKnowledgeObject) -> Dict[str, Any]:
        high_risks = len([
            r for r in cko.risks
            if isinstance(r, dict) and str(r.get("severity", "")).lower() == "high"
        ])
        return {
            "total_obligations":    len(cko.obligations),
            "total_risks":          len(cko.risks),
            "high_risks":           high_risks,
            "total_deadlines":      len(cko.deadlines),
            "total_evidence":       len(cko.evidence),
            "total_conflicts":      len(cko.conflicts),
            "compliance_score":     round(cko.compliance_score, 2),
            "risk_score":           round(cko.risk_score, 2),
            "risk_exposure_index":  round(high_risks * 1.5, 2),
            "readiness_rating":     "Optimum" if cko.compliance_score > 80.0 else "Needs Attention",
        }

    # ──────────────────────────────────────────────────────
    # Narrative sections
    # ──────────────────────────────────────────────────────
    def _generate_executive_summary(self, cko: ComplianceKnowledgeObject, kpis: Dict[str, Any]) -> str:
        score = kpis.get("compliance_score", 0.0)
        obs   = kpis.get("total_obligations", 0)
        risks = kpis.get("total_risks", 0)
        high  = kpis.get("high_risks", 0)
        rate  = kpis.get("readiness_rating", "Unknown")
        return (
            f"Enterprise regulatory analysis has concluded with an overall Compliance Score of {score}/100. "
            f"The system identified {obs} distinct regulatory obligations mapped across the organisation, "
            f"carrying {risks} potential risks, of which {high} are classified as high severity. "
            f"Current organisational readiness rating is assessed as '{rate}'."
        )

    def _generate_board_summary(self, cko: ComplianceKnowledgeObject, kpis: Dict[str, Any]) -> str:
        idx  = kpis.get("risk_exposure_index", 0.0)
        high = kpis.get("high_risks", 0)
        return (
            f"Strategic Board Advisory: The current enterprise risk exposure index sits at {idx}. "
            f"Executive management must immediately prioritise the mitigation and strategic alignment of {high} "
            "critical risk vectors. Continuous automated monitoring protocols remain active."
        )

    def _generate_audit_summary(self, cko: ComplianceKnowledgeObject) -> str:
        return (
            f"Audit Trail Verification: The platform successfully mapped {len(cko.obligations)} regulatory clauses "
            f"against {len(cko.evidence)} linked evidentiary artefacts. The system flagged {len(cko.conflicts)} "
            "semantic conflicts between internal policy and external regulatory mandate requiring manual adjudication."
        )

    def _generate_executive_notes(self, cko: ComplianceKnowledgeObject) -> str:
        return (
            f"Operational Mandate: {len(cko.recommendations)} AI-driven recommendations have been generated for "
            "deployment. Department heads must align capital expenditure with the prioritised mitigation paths "
            "outlined in the timeline. Immediate cross-functional alignment is required to address critical gaps."
        )