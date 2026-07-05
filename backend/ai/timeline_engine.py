# ==========================================================
# REGMAP AI ENTERPRISE
# ENTERPRISE TIMELINE ENGINE
# ==========================================================
# Generates a realistic corporate compliance workflow for
# every recommendation, following the exact sequence:
#   Treasury Review -> Compliance Validation -> Legal Review
#   -> Executive Approval -> Final Submission
# ==========================================================

import time
from datetime import datetime, timedelta
from models.compliance import ComplianceKnowledgeObject


class EnterpriseTimelineEngine:

    WORKFLOW_SEQUENCE = [
        {"phase": "Treasury Review",        "base_days": 3,  "owner_template": "Head of Treasury"},
        {"phase": "Compliance Validation",  "base_days": 5,  "owner_template": "Chief Compliance Officer"},
        {"phase": "Legal Review",           "base_days": 7,  "owner_template": "General Counsel"},
        {"phase": "Executive Approval",     "base_days": 2,  "owner_template": "Chief Executive Officer"},
        {"phase": "Final Submission",       "base_days": 1,  "owner_template": "Compliance Submission Team"},
    ]

    PRIORITY_MULTIPLIER = {
        "Critical": 0.5,
        "High":     1.0,
        "Medium":   1.5,
        "Low":      2.0,
    }

    def __init__(self):
        self.engine_name = "EnterpriseTimelineEngine"

    def analyze(self, cko: ComplianceKnowledgeObject) -> ComplianceKnowledgeObject:
        start_time = time.time()

        timeline_activities = []
        activity_id = 1
        base_date = datetime.utcnow()

        for rec in cko.recommendations:
            priority      = rec.get("priority", "Medium")
            rec_id        = rec.get("id",       f"REC-{activity_id:03d}")
            department    = rec.get("department", "Compliance")
            multiplier    = self.PRIORITY_MULTIPLIER.get(priority, 1.0)

            step_start = base_date
            prev_id    = None

            for step in self.WORKFLOW_SEQUENCE:
                duration_days = max(1, int(step["base_days"] * multiplier))
                step_end      = step_start + timedelta(days=duration_days)
                act_id_str    = f"ACT-{activity_id:04d}"

                activity = {
                    "id":                     act_id_str,
                    "title":                  f"[{rec_id}] {step['phase']}",
                    "phase":                  step["phase"],
                    "department":             department,
                    "priority":               priority,
                    "status":                 "Not Started",
                    "dependencies":           [prev_id] if prev_id else [],
                    "estimated_duration":     f"{duration_days} Days",
                    "start_date":             step_start.strftime("%Y-%m-%d"),
                    "end_date":               step_end.strftime("%Y-%m-%d"),
                    "owner":                  step["owner_template"],
                    "completion_percentage":  0,
                }

                timeline_activities.append(activity)
                prev_id    = act_id_str
                activity_id += 1
                step_start = step_end  # next step starts where previous ends

            # Move base_date forward so rec sequences don't all start on same day
            base_date = base_date + timedelta(days=1)

        cko.implementation_timeline = timeline_activities

        elapsed = time.time() - start_time
        cko.processing_time += elapsed
        # Remove legacy string entry if present
        cko.engine_history = [
            e for e in cko.engine_history
            if not (isinstance(e, str) and self.engine_name in e)
        ]

        print(
            f"[AI] Enterprise Timeline Engine Completed "
            f"({len(timeline_activities)} activities across "
            f"{len(cko.recommendations)} recommendations)"
        )
        return cko
