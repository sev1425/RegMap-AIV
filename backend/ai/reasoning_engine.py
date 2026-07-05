# ==========================================================
# REGMAP AI ENTERPRISE
# COMPLIANCE REASONING ENGINE
# ==========================================================


class ComplianceReasoningEngine:

    def __init__(self):
        pass

    # ======================================================
    # Enterprise Compliance Reasoning
    # ======================================================

    def analyze(self, cko):

        reasoning = {

            "overall_risk": "Low",

            "confidence": 100,

            "reasoning": [],

            "business_impact": "",

            "recommended_action": ""

        }

        mandatory = sum(
            1 for ob in cko.obligations
            if ob["category"] == "Mandatory"
        )

        deadline_count = len(cko.deadlines)

        conflict_count = len(cko.conflicts)

        high_risk = sum(
            1 for risk in cko.risks
            if risk["severity"] == "High"
        )

        # -------------------------------------------------
        # Rule 1
        # -------------------------------------------------

        if mandatory >= 5:

            reasoning["overall_risk"] = "Critical"

            reasoning["reasoning"].append(
                "Large number of mandatory obligations detected."
            )

        elif mandatory >= 3:

            reasoning["overall_risk"] = "High"

            reasoning["reasoning"].append(
                "Multiple mandatory obligations detected."
            )

        # -------------------------------------------------
        # Rule 2
        # -------------------------------------------------

        if deadline_count > 0:

            reasoning["reasoning"].append(
                "Compliance deadlines identified."
            )

            reasoning["confidence"] -= 2

        # -------------------------------------------------
        # Rule 3
        # -------------------------------------------------

        if conflict_count > 0:

            reasoning["reasoning"].append(
                "Potential compliance conflicts require review."
            )

            reasoning["confidence"] -= 3

        # -------------------------------------------------
        # Rule 4
        # -------------------------------------------------

        if high_risk > 0:

            reasoning["reasoning"].append(
                "High-risk obligations require immediate attention."
            )

            reasoning["confidence"] -= 5

        # -------------------------------------------------

        reasoning["business_impact"] = (

            "Delayed regulatory compliance may increase "
            "operational and regulatory exposure."

        )

        reasoning["recommended_action"] = (

            "Prioritize mandatory obligations, "
            "complete pending deadlines, "
            "and review high-risk compliance items."

        )

        cko.business_impact = reasoning

        print("[AI] Compliance Reasoning Engine Completed")

        return cko