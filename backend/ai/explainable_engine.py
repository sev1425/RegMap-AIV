# ==========================================================
# REGMAP AI ENTERPRISE
# EXPLAINABLE AI ENGINE (XAI)
# ==========================================================


class ExplainableAIEngine:

    def __init__(self):
        pass

    # ======================================================
    # Explain AI Decisions
    # ======================================================

    def analyze(self, cko):

        explanation = {}

        reasons = []

        engines_used = []

        # --------------------------------------------------
        # Mandatory Obligations
        # --------------------------------------------------

        mandatory = sum(
            1 for ob in cko.obligations
            if ob["category"] == "Mandatory"
        )

        if mandatory:

            reasons.append(
                f"{mandatory} mandatory obligations detected."
            )

            engines_used.append("ObligationEngine")

        # --------------------------------------------------
        # Deadlines
        # --------------------------------------------------

        if len(cko.deadlines):

            reasons.append(
                f"{len(cko.deadlines)} compliance deadline(s) detected."
            )

            engines_used.append("DeadlineEngine")

        # --------------------------------------------------
        # Risks
        # --------------------------------------------------

        high_risk = sum(
            1 for risk in cko.risks
            if risk["severity"] == "High"
        )

        if high_risk:

            reasons.append(
                f"{high_risk} high-risk compliance issue(s) identified."
            )

            engines_used.append("RiskEngine")

        # --------------------------------------------------
        # Conflicts
        # --------------------------------------------------

        if len(cko.conflicts):

            reasons.append(
                f"{len(cko.conflicts)} compliance conflict(s) require review."
            )

            engines_used.append("ConflictEngine")

        # --------------------------------------------------
        # Recommendation Count
        # --------------------------------------------------

        if len(cko.recommendations):

            reasons.append(
                f"{len(cko.recommendations)} AI recommendations generated."
            )

            engines_used.append("RecommendationEngine")

        # --------------------------------------------------
        # Final Explainability Object
        # --------------------------------------------------

        explanation = {

            "decision": cko.business_impact["overall_risk"],

            "confidence": cko.business_impact["confidence"],

            "explanations": reasons,

            "engines_used": list(set(engines_used)),

            "recommended_next_step":
                cko.business_impact["recommended_action"]

        }

        cko.metadata["explainable_ai"] = explanation

        print("[AI] Explainable AI Engine Completed")

        return cko