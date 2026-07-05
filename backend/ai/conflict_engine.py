# ==========================================================
# REGMAP AI ENTERPRISE
# CONFLICT INTELLIGENCE ENGINE
# ==========================================================

import re


class ConflictEngine:

    def __init__(self):
        # Density threshold: mandatory obligations as a fraction of total sentences
        self._density_threshold = 0.35   # 35% of sentences being mandatory = high density
        self._min_mandatory_for_density = 5

    def analyze(self, cko):
        conflicts = []
        conflict_id = 1

        mandatory = [ob for ob in cko.obligations if ob["category"] == "Mandatory"]
        advisory  = [ob for ob in cko.obligations if ob["category"] == "Advisory"]
        total_obs = len(cko.obligations)

        # ----------------------------------------------------------
        # Conflict 1: High Obligation Density (document-size-aware)
        # ----------------------------------------------------------
        if total_obs > 0 and len(mandatory) >= self._min_mandatory_for_density:
            density = len(mandatory) / total_obs
            if density >= self._density_threshold:
                conflicts.append({
                    "id": f"CON-{conflict_id:03}",
                    "type": "High Obligation Density",
                    "severity": "High",
                    "description": (
                        f"{len(mandatory)} of {total_obs} obligations ({density:.0%}) are mandatory. "
                        "High density of non-negotiable requirements increases implementation risk."
                    ),
                    "affected_obligations": len(mandatory),
                    "density_ratio": round(density, 2),
                    "status": "Open"
                })
                conflict_id += 1

        # ----------------------------------------------------------
        # Conflict 2: Mandatory obligations with deadlines
        # ----------------------------------------------------------
        if cko.deadlines and mandatory:
            # Find which mandatory obligations have nearby deadlines
            deadline_texts = " ".join(str(d.get("text", "")) for d in cko.deadlines).lower()
            matched = []
            for ob in mandatory:
                ob_words = set(re.findall(r'\w+', ob["text"].lower()))
                deadline_words = set(re.findall(r'\w+', deadline_texts))
                if ob_words & deadline_words - {"the", "a", "an", "of", "and", "or", "to", "in", "for"}:
                    matched.append(ob)

            severity = "High" if len(matched) >= 3 else "Medium"
            conflicts.append({
                "id": f"CON-{conflict_id:03}",
                "type": "Time-Bound Mandatory Obligations",
                "severity": severity,
                "description": (
                    f"{len(matched) if matched else len(mandatory)} mandatory obligations are linked to "
                    f"{len(cko.deadlines)} deadlines. Non-compliance within deadline windows triggers regulatory penalties."
                ),
                "affected_obligations": len(matched) or len(mandatory),
                "status": "Monitor"
            })
            conflict_id += 1

        # ----------------------------------------------------------
        # Conflict 3: Contradictory language (shall + may on same topic)
        # ----------------------------------------------------------
        shall_topics = set()
        may_topics = set()
        topic_words = {"bank", "banks", "entity", "entities", "licensee", "institution", "firm", "company"}

        for ob in mandatory:
            words = set(re.findall(r'\b[a-z]{4,}\b', ob["text"].lower())) & topic_words
            shall_topics |= words

        for ob in advisory:
            words = set(re.findall(r'\b[a-z]{4,}\b', ob["text"].lower())) & topic_words
            may_topics |= words

        overlapping_topics = shall_topics & may_topics
        if overlapping_topics:
            conflicts.append({
                "id": f"CON-{conflict_id:03}",
                "type": "Contradictory Obligation Language",
                "severity": "Medium",
                "description": (
                    "Some obligations use both mandatory ('shall'/'must') and permissive ('may'/'should') "
                    "language for the same regulated entities, which may create ambiguity in compliance scope."
                ),
                "affected_topics": list(overlapping_topics),
                "status": "Review"
            })

        cko.conflicts = conflicts

        print(f"[AI] Conflict Engine Completed ({len(conflicts)} conflicts)")

        return cko
