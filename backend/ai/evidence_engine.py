# ==========================================================
# REGMAP AI ENTERPRISE
# EVIDENCE INTELLIGENCE ENGINE
# ==========================================================

import re


class EvidenceEngine:

    def __init__(self):
        pass

    # ======================================================
    # Analyze Evidence
    # ======================================================

    def analyze(self, cko):

        evidence_list = []

        sentences = re.split(r'(?<=[.!?])\s+', cko.raw_text)

        evidence_id = 1

        for obligation in cko.obligations:

            obligation_text = obligation["text"].lower()

            matched_sentence = ""

            for sentence in sentences:

                if obligation_text[:40] in sentence.lower():

                    matched_sentence = sentence.strip()

                    break

            evidence = {

                "id": f"EVD-{evidence_id:03}",

                "obligation": obligation["text"],

                "source_obligation_id": obligation.get("id", ""),

                "evidence": matched_sentence,

                "source": "Document",

                "status": "Available" if matched_sentence else "Missing",

                "confidence": 100 if matched_sentence else 0

            }

            evidence_list.append(evidence)

            evidence_id += 1

        cko.evidence = evidence_list

        print(
            f"[AI] Evidence Engine Completed "
            f"({len(evidence_list)} evidence records)"
        )

        return cko