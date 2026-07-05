# ==========================================================
# REGMAP AI ENTERPRISE
# MAP ENGINE — MEASURABLE ACTION POINTS GENERATOR
# ==========================================================
# Core hackathon feature: Converts obligations into structured,
# trackable MAPs with department, deadline, evidence, penalty.
# ==========================================================

import re
import hashlib
import datetime

DEPT_ROUTING = {
    "IT / CISO": [
        "cyber", "information security", "ciso", "encryption", "firewall",
        "data breach", "incident", "server", "database", "software", "system",
        "digital infrastructure", "network", "vulnerability", "patch",
        "access control", "authentication", "iso 27001", "pci-dss",
    ],
    "Legal / Compliance": [
        "dpdp", "data protection", "personal data", "privacy", "consent",
        "gdpr", "legal", "licence", "section 46", "banking regulation act",
        "sebi", "mca", "iba", "legal entity", "court", "adjudication",
    ],
    "Compliance": [
        "compliance", "regulatory", "rbi", "mandatory", "shall report",
        "submit", "circular", "notification", "direction", "master direction",
        "returns", "reporting", "quarterly", "annual report",
    ],
    "Risk": [
        "risk", "credit risk", "market risk", "operational risk", "exposure",
        "stress test", "capital adequacy", "npa", "provisioning",
        "risk appetite", "risk register",
    ],
    "HR / Legal": [
        "officer", "appoint", "appointment", "dpo", "ciso appointment",
        "board approval", "board resolution", "employee", "staff", "training",
        "awareness", "human resources",
    ],
    "Finance": [
        "finance", "financial statement", "accounting", "audit", "balance sheet",
        "income statement", "provisioning", "capital", "reserves",
    ],
    "Operations": [
        "operations", "processing", "settlement", "bcp", "business continuity",
        "disaster recovery", "drill", "testing", "branch", "service delivery",
    ],
    "Treasury": [
        "treasury", "liquidity", "forex", "foreign exchange", "slr", "crr",
        "money market", "bonds", "securities",
    ],
}

EVIDENCE_MAP = {
    "policy": "Board-approved policy document",
    "report": "Submission report / return to regulator",
    "appointment": "Board resolution + appointment letter",
    "training": "Training completion certificates, attendance records",
    "audit": "Internal/external audit report",
    "test": "Drill/test report with results documentation",
    "submit": "Submission receipt / acknowledgement from regulator",
    "encryption": "Encryption audit certificate, security assessment report",
    "consent": "Consent management framework documentation",
    "data": "Data flow map, data inventory, DPA documentation",
    "log": "System log samples, log retention proof",
    "certificate": "Compliance certificate from qualified assessor",
    "comply": "Compliance declaration signed by CXO",
    "maintain": "Evidence of ongoing maintenance — logs, records",
    "ensure": "Implementation evidence, signed-off checklist",
    "implement": "Implementation sign-off, technical documentation",
}

PENALTY_MAP = [
    (["dpdp", "personal data", "data protection officer", "data principal"], "Up to ₹250 Cr (DPDP Act 2023)"),
    (["section 46", "banking regulation act", "licence revocation"], "₹1 Cr – Licence Revocation (BR Act)"),
    (["cyber", "ciso", "information security", "iso 27001", "incident"], "₹1–5 Cr + Regulatory Action (RBI CSF)"),
    (["sebi", "securities"], "₹25 Cr + Trading Suspension (SEBI)"),
    (["lending", "digital lending", "nbfc"], "₹25 Cr + Cancellation (RBI DLG)"),
    (["rbi", "reserve bank", "mandatory", "shall", "must"], "₹1–2 Cr + Corrective Action (RBI)"),
]

DEADLINE_HEURISTICS = [
    (["immediate", "forthwith", "within 6 hours", "within 24 hours"], 1, "Immediate"),
    (["7 days", "one week", "seven days"], 7, "7 days"),
    (["15 days", "fifteen days"], 15, "15 days"),
    (["30 days", "one month", "thirty days"], 30, "30 days"),
    (["60 days", "two months", "sixty days"], 60, "60 days"),
    (["90 days", "three months", "ninety days", "quarterly"], 90, "90 days"),
    (["6 months", "six months", "180 days"], 180, "6 months"),
    (["1 year", "one year", "annual", "annually", "31 march", "march 31"], 365, "Annual / 31 March"),
]


def _route_department(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for dept, keywords in DEPT_ROUTING.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[dept] = score
    if not scores:
        return "Compliance"
    return max(scores, key=scores.get)


def _estimate_deadline(text: str):
    text_lower = text.lower()
    for triggers, days, label in DEADLINE_HEURISTICS:
        if any(t in text_lower for t in triggers):
            due = datetime.date.today() + datetime.timedelta(days=days)
            return label, due.strftime("%d %b %Y"), due.strftime("%Y-%m-%d"), days
    # Default: 30-day regulatory standard
    due = datetime.date.today() + datetime.timedelta(days=30)
    return "30 days (default)", due.strftime("%d %b %Y"), due.strftime("%Y-%m-%d"), 30


def _build_evidence(text: str) -> str:
    text_lower = text.lower()
    found = []
    for keyword, evidence in EVIDENCE_MAP.items():
        if keyword in text_lower and evidence not in found:
            found.append(evidence)
    if not found:
        found.append("Compliance declaration signed by senior officer")
    return "; ".join(found[:3])


def _estimate_penalty(text: str) -> str:
    text_lower = text.lower()
    for triggers, penalty in PENALTY_MAP:
        if any(t in text_lower for t in triggers):
            return penalty
    return "₹50L–2 Cr (Standard RBI Penalty)"


def _map_priority(obligation: dict, days: int) -> str:
    cat = obligation.get("category", "")
    if days <= 7 or cat == "Mandatory":
        return "Critical"
    if days <= 30:
        return "High"
    if days <= 90:
        return "Medium"
    return "Low"


class MAPEngine:
    """
    Measurable Action Points Engine.

    Converts raw obligations from CKO into structured, trackable
    action points with per-obligation department routing, deadlines,
    evidence requirements, and penalty exposure.
    """

    def analyze(self, cko):
        maps = []
        for i, obligation in enumerate(cko.obligations, start=1):
            text = obligation.get("text", "")
            if not text.strip():
                continue

            department = _route_department(text)
            deadline_label, deadline_date, deadline_date_iso, days = _estimate_deadline(text)
            priority = _map_priority(obligation, days)
            evidence = _build_evidence(text)
            penalty = _estimate_penalty(text)

            map_id = f"MAP-{i:03}"
            content_hash = hashlib.sha1(text.strip().lower().encode()).hexdigest()[:8]

            maps.append({
                "id": map_id,
                "hash": content_hash,
                "obligation_id": obligation.get("id", ""),
                "obligation_text": text,
                "department": department,
                "priority": priority,
                "deadline_label": deadline_label,
                "deadline_date": deadline_date,
                "deadline_date_iso": deadline_date_iso,
                "days_to_deadline": days,
                "evidence_required": evidence,
                "penalty_exposure": penalty,
                "status": "Pending",
                "category": obligation.get("category", "Operational"),
                "confidence": obligation.get("confidence", 1.0),
                "created_at": datetime.datetime.now().isoformat(),
            })

        # Sort: Critical first, then by days
        priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        maps.sort(key=lambda m: (priority_order.get(m["priority"], 9), m["days_to_deadline"]))

        cko.maps = maps

        print(f"[AI] MAP Engine Completed ({len(maps)} MAPs generated)")
        return cko
