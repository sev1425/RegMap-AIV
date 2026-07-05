# ==========================================================
# REGMAP AI ENTERPRISE
# DECISION ENGINE
# ==========================================================


class DecisionEngine:

    def __init__(self):
        pass

    # ======================================================
    # Compliance Decision Analysis
    # ======================================================

    def analyze(self, cko):

        mandatory = 0
        advisory = 0

        for obligation in cko.obligations:

            if obligation["category"] == "Mandatory":
                mandatory += 1

            elif obligation["category"] == "Advisory":
                advisory += 1

        deadline_count = len(cko.deadlines)

        # --------------------------------------------------
        # Compliance Score
        # --------------------------------------------------

        score = 100

        score -= mandatory * 10

        score -= deadline_count * 5

        score = max(score, 0)

        cko.risk_score = score

        # --------------------------------------------------
        # Priority
        # --------------------------------------------------

        if mandatory >= 5:

            priority = "Critical"

        elif mandatory >= 3:

            priority = "High"

        elif mandatory >= 1:

            priority = "Medium"

        else:

            priority = "Low"

        cko.priority = priority

        # --------------------------------------------------
        # Decision Summary
        # --------------------------------------------------

        cko.executive_dashboard = {

            "mandatory_obligations": mandatory,

            "advisory_obligations": advisory,

            "deadlines": deadline_count,

            "priority": priority,

            "compliance_score": score

        }

        print(

            f"[AI] Decision Engine Completed "

            f"(Priority: {priority})"

        )

        return cko