# ==========================================================
# REGMAP AI ENTERPRISE
# COMPLIANCE KNOWLEDGE OBJECT (CKO)
# ==========================================================

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class ComplianceKnowledgeObject:

    # ======================================================
    # DOCUMENT INFORMATION
    # ======================================================

    title: str = ""
    issuer: str = ""
    document_type: str = ""
    document_version: str = ""
    source_filename: str = ""
    raw_text: str = ""

    # ======================================================
    # DOCUMENT ANALYSIS
    # ======================================================

    summary: str = ""
    document_statistics: Dict[str, Any] = field(default_factory=dict)

    # ======================================================
    # AI INTELLIGENCE
    # ======================================================

    entities: Dict[str, List] = field(default_factory=dict)

    obligations: List[Dict] = field(default_factory=list)

    deadlines: List[Dict] = field(default_factory=list)

    departments: List[Dict] = field(default_factory=list)

    risks: List[Dict] = field(default_factory=list)

    evidence: List[Dict] = field(default_factory=list)

    conflicts: List[Dict] = field(default_factory=list)

    recommendations: List[Dict] = field(default_factory=list)

    # ======================================================
    # EXECUTIVE INTELLIGENCE
    # ======================================================

    compliance_score: float = 100.0

    risk_score: float = 0.0

    priority: str = "Low"

    business_impact: Dict[str, Any] = field(default_factory=dict)

    executive_dashboard: Dict[str, Any] = field(default_factory=dict)

    compliance_health: Dict[str, Any] = field(default_factory=dict)

    summaries: Dict[str, str] = field(default_factory=dict)

    # ======================================================
    # ENTERPRISE OUTPUTS
    # ======================================================

    implementation_timeline: List[Dict] = field(default_factory=list)

    enterprise_report: Dict[str, Any] = field(default_factory=dict)

    knowledge_graph: Dict[str, Any] = field(default_factory=dict)

    audit_log: List[Dict] = field(default_factory=list)

    maps: List[Dict] = field(default_factory=list)

    warnings: List[str] = field(default_factory=list)

    # ======================================================
    # SYSTEM METADATA
    # ======================================================

    processing_time: float = 0.0

    engine_history: List[str] = field(default_factory=list)

    metadata: Dict[str, Any] = field(default_factory=dict)