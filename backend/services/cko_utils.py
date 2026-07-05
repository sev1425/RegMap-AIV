from dataclasses import asdict, is_dataclass
from typing import Any, Dict, List

from models.compliance import ComplianceKnowledgeObject


def cko_to_dict(cko: ComplianceKnowledgeObject) -> Dict[str, Any]:
    if is_dataclass(cko):
        return asdict(cko)
    return dict(getattr(cko, "__dict__", {}) or {})


def build_cko_from_dict(data: Dict[str, Any]) -> ComplianceKnowledgeObject:
    cko = ComplianceKnowledgeObject()
    for field, value in (data or {}).items():
        if hasattr(cko, field):
            setattr(cko, field, value)
    return cko


def normalize_obligations(obligations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []
    for index, item in enumerate(obligations or [], start=1):
        text = item.get("text") or item.get("obligation_text") or item.get("description") or ""
        normalized.append({
            **item,
            "id": item.get("id") or f"OBL-{index:03}",
            "text": text,
            "obligation_text": text,
            "department": item.get("department") or item.get("owner") or "Compliance",
            "category": item.get("category") or "Operational",
            "priority": item.get("priority") or ("High" if item.get("category") == "Mandatory" else "Medium"),
            "status": item.get("status") or "Pending",
        })
    return normalized


def normalize_deadlines(deadlines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []
    for index, item in enumerate(deadlines or [], start=1):
        deadline = item.get("deadline") or item.get("date_expression") or item.get("due_date") or "No date"
        text = item.get("deadline_text") or item.get("text") or f"Complete required activity by {deadline}"
        normalized.append({
            **item,
            "id": item.get("id") or f"DDL-{index:03}",
            "deadline": deadline,
            "date_expression": deadline,
            "deadline_text": text,
            "department_mentioned": item.get("department_mentioned") or item.get("department") or "Compliance",
            "priority": item.get("priority") or "High",
            "status": item.get("status") or "Pending",
        })
    return normalized


def normalize_risks(risks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []
    for index, item in enumerate(risks or [], start=1):
        source = item.get("source") or item.get("description") or ""
        normalized.append({
            **item,
            "id": item.get("id") or f"RISK-{index:03}",
            "description": item.get("description") or source or "Regulatory risk requires review",
            "source": source,
            "severity": item.get("severity") or "Medium",
            "status": item.get("status") or "Open",
        })
    return normalized


def readiness_score(evidence: List[Dict[str, Any]]) -> float:
    if not evidence:
        return 0.0
    available = sum(1 for item in evidence if str(item.get("status", "")).lower() == "available")
    return round((available / len(evidence)) * 100, 1)


def build_unified_dashboard(cko_data: Dict[str, Any]) -> Dict[str, Any]:
    cko_data = cko_data or {}
    dashboard = dict(cko_data.get("executive_dashboard") or {})

    obligations = normalize_obligations(cko_data.get("obligations", []))
    deadlines = normalize_deadlines(cko_data.get("deadlines", []))
    risks = normalize_risks(cko_data.get("risks", []))
    evidence = cko_data.get("evidence", []) or []
    report = cko_data.get("enterprise_report", {}) or {}
    maps = cko_data.get("maps", []) or []

    # ── Resolution state, computed fresh from MAPs every time ──────────
    # This is the single source of truth for "what has been resolved" —
    # it reflects status changes made anywhere (MAP Tracker, Task
    # Generator AI auto-resolve, etc.) and survives page reloads, unlike
    # a client-only memory flag.
    completed_maps = [m for m in maps if m.get("status") == "Complete"]
    total_maps = len(maps)
    completed_map_count = len(completed_maps)
    resolved_obligation_ids = {m.get("obligation_id") for m in completed_maps if m.get("obligation_id")}
    map_completion_pct = round((completed_map_count / total_maps) * 100, 1) if total_maps else 0.0

    for item in obligations:
        item["resolved"] = item.get("id") in resolved_obligation_ids
    for item in risks:
        item["resolved"] = item.get("source_obligation_id") in resolved_obligation_ids

    resolved_obligations_count = sum(1 for o in obligations if o.get("resolved"))
    resolved_risks_count = sum(1 for r in risks if r.get("resolved"))
    resolved_high_risks_count = sum(1 for r in risks if r.get("resolved") and r.get("severity") in ("Critical", "High"))

    analytics = dashboard.get("analytics") or {}
    analytics.setdefault("readiness_score", readiness_score(evidence))
    analytics["timeline_progress"] = {
        "total_tasks": total_maps or len(cko_data.get("implementation_timeline", []) or []),
        "completed": completed_map_count,
        "completion_percentage": map_completion_pct,
    }
    base_compliance_kpi = {
        "compliance_score": round(float(cko_data.get("compliance_score", dashboard.get("compliance_score", 0)) or 0), 1),
        "risk_score": round(float(cko_data.get("risk_score", 0) or 0), 1),
        "total_obligations": len(obligations),
        "mandatory_obligations": sum(1 for item in obligations if item.get("category") == "Mandatory"),
        "total_risks": len(risks),
        "high_risks": sum(1 for item in risks if item.get("severity") == "High"),
        "total_deadlines": len(deadlines),
        "total_departments": len(cko_data.get("departments", []) or []),
        "overall_risk": dashboard.get("overall_risk", "Unknown"),
    }
    # Always recompute the resolution-derived fields, even if compliance_kpi
    # already existed on the dashboard dict from a prior pipeline run —
    # these must reflect the *current* MAP state, not a stale snapshot.
    base_compliance_kpi.update({
        "total_maps": total_maps,
        "completed_maps": completed_map_count,
        "pending_maps": total_maps - completed_map_count,
        "map_completion_percentage": map_completion_pct,
        "resolved_obligations": resolved_obligations_count,
        "pending_obligations": len(obligations) - resolved_obligations_count,
        "resolved_risks": resolved_risks_count,
        "pending_risks": len(risks) - resolved_risks_count,
        "resolved_high_risks": resolved_high_risks_count,
        "pending_high_risks": sum(1 for r in risks if r.get("severity") == "High") - resolved_high_risks_count,
    })
    analytics["compliance_kpi"] = {**dashboard.get("analytics", {}).get("compliance_kpi", {}), **base_compliance_kpi}

    dashboard.update({
        "title": cko_data.get("title") or dashboard.get("title") or "Regulatory Document",
        "source_filename": cko_data.get("source_filename") or "",
        "issuer": cko_data.get("issuer") or "",
        "document_type": cko_data.get("document_type") or "",
        "summary": cko_data.get("summary") or dashboard.get("executive_summary") or "",
        "executive_summary": dashboard.get("executive_summary") or cko_data.get("summary") or report.get("executive_summary") or "",
        "compliance_score": cko_data.get("compliance_score", dashboard.get("compliance_score", 0)),
        "risk_score": cko_data.get("risk_score", dashboard.get("risk_score", 0)),
        "priority": cko_data.get("priority", dashboard.get("priority", "Low")),
        "business_impact": dashboard.get("business_impact") or (cko_data.get("business_impact") or {}).get("business_impact", ""),
        "recommended_action": dashboard.get("recommended_action") or (cko_data.get("business_impact") or {}).get("recommended_action", ""),
        "obligations": obligations,
        "deadlines": deadlines,
        "departments": cko_data.get("departments", []) or [],
        "risks": risks,
        "maps": cko_data.get("maps", []) or [],
        "evidence": evidence,
        "conflicts": cko_data.get("conflicts", []) or [],
        "recommendations": cko_data.get("recommendations", []) or [],
        "implementation_timeline": cko_data.get("implementation_timeline", []) or [],
        "knowledge_graph": cko_data.get("knowledge_graph", {}) or {},
        "enterprise_report": report,
        "analytics": analytics,
        "engine_history": cko_data.get("engine_history", []) or [],
        "exports": report.get("exports", {}),
        "audit_readiness": readiness_score(evidence),
        "warnings": cko_data.get("warnings", []),
    })

    return dashboard
