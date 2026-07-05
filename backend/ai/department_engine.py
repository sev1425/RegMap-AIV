# ==========================================================
# REGMAP AI ENTERPRISE
# DEPARTMENT INTELLIGENCE ENGINE
# Enhanced: per-obligation routing + confidence scoring
# ==========================================================

import re


DEPT_KEYWORDS = {
    "IT / CISO": [
        "cyber", "information security", "ciso", "encryption", "firewall",
        "data breach", "incident", "server", "database", "software", "system",
        "digital infrastructure", "network", "vulnerability", "patch",
        "access control", "authentication", "iso 27001", "pci-dss", "log",
        "digital channel", "end-to-end",
    ],
    "Legal / Compliance": [
        "dpdp", "data protection", "personal data", "privacy", "consent",
        "legal", "licence", "section 46", "banking regulation act", "act",
        "adjudication", "court",
    ],
    "Compliance": [
        "compliance", "regulatory", "rbi", "submit", "circular",
        "notification", "direction", "master direction", "returns",
        "reporting", "quarterly", "annual report", "sebi", "iba", "mca",
    ],
    "Risk": [
        "risk", "credit risk", "market risk", "operational risk", "exposure",
        "stress test", "capital adequacy", "npa", "provisioning",
    ],
    "HR / Legal": [
        "officer", "appoint", "appointment", "dpo", "board approval",
        "board resolution", "employee", "staff", "training", "awareness",
    ],
    "Operations": [
        "operations", "processing", "settlement", "bcp", "business continuity",
        "disaster recovery", "drill", "testing", "branch",
    ],
    "Finance": [
        "finance", "financial statement", "accounting", "audit committee",
        "balance sheet", "capital", "reserves",
    ],
    "Treasury": [
        "treasury", "liquidity", "forex", "foreign exchange", "slr", "crr",
        "money market",
    ],
}


def _route_obligation(text: str) -> tuple:
    """Returns (primary_dept, secondary_dept, confidence)"""
    text_lower = text.lower()
    scores = {}
    for dept, keywords in DEPT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[dept] = score

    if not scores:
        return "Compliance", None, 60

    sorted_depts = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_depts[0][0]
    secondary = sorted_depts[1][0] if len(sorted_depts) > 1 else None

    total = sum(scores.values())
    confidence = min(100, int((sorted_depts[0][1] / total) * 100)) if total else 60
    return primary, secondary, confidence


class DepartmentEngine:

    def analyze(self, cko):
        # 1. Per-obligation routing
        for obligation in cko.obligations:
            text = obligation.get("text", "")
            primary, secondary, conf = _route_obligation(text)
            obligation["department"] = primary
            obligation["department_secondary"] = secondary
            obligation["department_confidence"] = conf

        # 2. Document-level department summary (for dashboard)
        text_full = cko.raw_text.lower()
        departments = []
        for dept, keywords in DEPT_KEYWORDS.items():
            score = sum(
                len(re.findall(r"\b" + re.escape(kw) + r"\b", text_full))
                for kw in keywords
            )
            if score > 0:
                departments.append({
                    "department": dept,
                    "confidence": min(100, score * 15),
                    "status": "Affected",
                    "obligation_count": sum(
                        1 for o in cko.obligations
                        if o.get("department") == dept or o.get("department_secondary") == dept
                    )
                })

        departments.sort(key=lambda d: d["confidence"], reverse=True)
        cko.departments = departments

        print(f"[AI] Department Engine Completed ({len(departments)} departments | "
              f"per-obligation routing applied to {len(cko.obligations)} obligations)")
        return cko
