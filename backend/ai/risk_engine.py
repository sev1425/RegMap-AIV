# ==========================================================
# REGMAP AI ENTERPRISE
# RISK INTELLIGENCE ENGINE — Enhanced with penalty estimation
# ==========================================================

import re
import hashlib


PENALTY_RULES = [
    (["dpdp", "digital personal data", "data principal", "data protection officer", "dpo"],
     "Up to ₹250 Cr", "DPDP Act 2023 – Section 33"),
    (["section 46", "licence", "banking regulation act", "br act"],
     "₹1 Cr – Licence Revocation", "Banking Regulation Act 1949 – S.46"),
    (["cyber", "ciso", "information security", "iso 27001", "cyber incident", "data breach"],
     "₹1–5 Cr + RBI Action", "RBI Cyber Security Framework 2016"),
    (["sebi", "securities", "stock exchange", "listed"],
     "₹25 Cr + Trading Halt", "SEBI Act – Section 15"),
    (["digital lending", "nbfc", "digital loan"],
     "₹25 Cr + Cancellation", "RBI Digital Lending Guidelines 2022"),
    (["pci-dss", "card", "payment", "pos terminal"],
     "₹5–50 Cr + Card Scheme Penalties", "PCI-DSS v4.0"),
    (["rbi", "reserve bank", "mandatory", "shall", "must"],
     "₹50L–2 Cr", "RBI Act 1934 – Section 58G"),
]

SEVERITY_UPGRADES = {
    "dpdp": "Critical",
    "section 46": "Critical",
    "cyber incident": "Critical",
    "licence": "Critical",
    "mandatory": "High",
    "shall": "High",
    "must": "High",
}


def _estimate_penalty(text: str):
    text_lower = text.lower()
    for triggers, penalty, regulation in PENALTY_RULES:
        if any(t in text_lower for t in triggers):
            return penalty, regulation
    return "₹50L–1 Cr (Standard)", "RBI Master Circular"


def _severity(obligation: dict, text_lower: str) -> str:
    # Upgrade severity based on critical keywords
    for kw, sev in SEVERITY_UPGRADES.items():
        if kw in text_lower:
            return sev
    # Fall back to category-based
    cat = obligation.get("category", "")
    if cat == "Mandatory":
        return "High"
    if cat == "Operational":
        return "Medium"
    return "Low"


class RiskEngine:

    def analyze(self, cko):
        risks = []

        for obligation in cko.obligations:
            text = obligation.get("text", "")
            text_lower = text.lower()

            penalty_amount, regulation = _estimate_penalty(text_lower)
            severity = _severity(obligation, text_lower)

            content_hash = hashlib.sha1(
                re.sub(r'[.!?]+$', '', text.strip()).lower().encode("utf-8")
            ).hexdigest()[:10]

            risks.append({
                "id": content_hash,
                "label": f"RISK-{len(risks)+1:03}",
                "severity": severity,
                "source": text,
                "source_obligation_id": obligation.get("id", ""),
                "penalty_exposure": penalty_amount,
                "regulation_reference": regulation,
                "status": "Open",
                "recommendation": (
                    f"Immediately review and satisfy the mandatory compliance requirement. "
                    f"Failure may attract {penalty_amount} under {regulation}."
                )
            })

        # Sort critical first
        order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        risks.sort(key=lambda r: order.get(r["severity"], 9))

        cko.risks = risks

        print(f"[AI] Risk Engine Completed ({len(risks)} risks | "
              f"{sum(1 for r in risks if r['severity']=='Critical')} critical)")
        return cko
