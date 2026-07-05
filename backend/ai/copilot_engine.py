import time
import re
from typing import Dict, Any
from models.compliance import ComplianceKnowledgeObject


class OfflineAICopilotEngine:
    """
    Offline AI Copilot Engine

    Answers natural language queries about the document using only the locally
    processed ComplianceKnowledgeObject (CKO). No external APIs used.
    Designed for air-gapped / data-residency-sensitive environments.
    """

    def __init__(self):
        self.engine_name = "OfflineAICopilotEngine"

        # Intent → (trigger_words, handler)
        self._intents = [
            (["summarize", "summary", "overview", "what is this", "about"],           self._handle_summary),
            (["obligation", "requirement", "must", "shall", "mandatory"],              self._handle_obligations),
            (["deadline", "due date", "timeline", "when", "by when", "date"],         self._handle_deadlines),
            (["high risk", "critical risk", "top risk", "worst risk"],                 self._handle_high_risks),
            (["risk", "risks", "danger", "exposure"],                                  self._handle_risks),
            (["score", "compliance score", "rating", "how compliant"],                 self._handle_score),
            (["conflict", "contradiction", "clash", "inconsistent"],                   self._handle_conflicts),
            (["department", "team", "who is responsible", "treasury", "ownership"],    self._handle_departments),
            (["recommend", "suggestion", "what should", "next step", "action"],        self._handle_recommendations),
            (["explain", "why", "reason", "critical", "detail"],                       self._handle_explain),
            (["how many", "count", "total", "number of"],                              self._handle_counts),
        ]

    def query(self, cko: ComplianceKnowledgeObject, user_query: str) -> Dict[str, Any]:
        start_time = time.time()
        q = user_query.lower().strip()

        handler = self._match_intent(q)
        response_text, data_payload = handler(cko, q)

        elapsed_time = time.time() - start_time
        confidence = self._confidence(q, data_payload)

        return {
            "query": user_query,
            "response": response_text,
            "data": data_payload,
            "confidence": confidence,
            "processing_time_seconds": round(elapsed_time, 4),
            "engine": self.engine_name,
            "offline_mode": True,
        }

    def _match_intent(self, q: str):
        query_words = set(re.findall(r'\w+', q.lower()))
        if not query_words:
            return self._handle_fallback
            
        best_score = 0
        best_handler = self._handle_fallback
        
        for triggers, handler in self._intents:
            trigger_words = set()
            for t in triggers:
                trigger_words.update(re.findall(r'\w+', t.lower()))
                
            overlap = len(query_words & trigger_words)
            score = overlap / len(query_words)
            
            if score > best_score:
                best_score = score
                best_handler = handler
                
        if best_score > 0.2:
            return best_handler
            
        return self._handle_fallback

    def _confidence(self, q: str, data: dict) -> int:
        if not data:
            return 40
        if len(q.split()) <= 2:
            return 75
        return 90

    # ------------------------------------------------------------------
    # Handlers
    # ------------------------------------------------------------------

    def _handle_summary(self, cko, q):
        text = cko.summary or "The document contains compliance requirements and risk assessments."
        stats = cko.document_statistics or {}
        extra = ""
        if stats.get("word_count"):
            extra = f" The document contains approximately {stats['word_count']} words."
        return (
            f"{text}{extra} It contains {len(cko.obligations)} obligations, "
            f"{len(cko.risks)} risks, and {len(cko.deadlines)} deadlines.",
            {"summary": text, "stats": stats}
        )

    def _handle_obligations(self, cko, q):
        obs = cko.obligations
        mandatory = [o for o in obs if o.get("category") == "Mandatory"]
        advisory  = [o for o in obs if o.get("category") == "Advisory"]
        operational = [o for o in obs if o.get("category") == "Operational"]

        if "mandatory" in q or "must" in q or "shall" in q:
            return (
                f"There are {len(mandatory)} mandatory obligations — these are non-negotiable "
                f"compliance requirements using language like 'shall' or 'must'.",
                {"obligations": mandatory}
            )
        return (
            f"There are {len(obs)} total obligations: {len(mandatory)} mandatory, "
            f"{len(advisory)} advisory, and {len(operational)} operational.",
            {"obligations": obs, "breakdown": {"mandatory": len(mandatory), "advisory": len(advisory), "operational": len(operational)}}
        )

    def _handle_deadlines(self, cko, q):
        deadlines = cko.deadlines
        if not deadlines:
            return ("No explicit deadlines were detected in this document.", {"deadlines": []})
        upcoming = sorted(deadlines, key=lambda d: str(d.get("date", "")))
        nearest = upcoming[0] if upcoming else None
        msg = f"There are {len(deadlines)} deadlines tracked."
        if nearest:
            msg += f" The earliest is: '{nearest.get('text', nearest.get('date', 'unknown'))}'."
        return (msg, {"deadlines": deadlines})

    def _handle_high_risks(self, cko, q):
        high = [r for r in cko.risks if str(r.get("severity", "")).lower() in ("high", "critical")]
        if not high:
            return ("No high or critical risks were identified in this document.", {"risks": []})
        return (
            f"There are {len(high)} high/critical risks. The top risk is: '{high[0].get('source', '')[:120]}'.",
            {"risks": high}
        )

    def _handle_risks(self, cko, q):
        risks = cko.risks
        by_severity = {"High": 0, "Medium": 0, "Low": 0}
        for r in risks:
            sev = str(r.get("severity", "Low"))
            by_severity[sev] = by_severity.get(sev, 0) + 1
        return (
            f"There are {len(risks)} risks identified: "
            f"{by_severity.get('High', 0)} high, {by_severity.get('Medium', 0)} medium, "
            f"{by_severity.get('Low', 0)} low severity.",
            {"risks": risks, "breakdown": by_severity}
        )

    def _handle_score(self, cko, q):
        score = cko.compliance_score
        level = "excellent" if score >= 85 else "moderate" if score >= 65 else "poor"
        return (
            f"The compliance score is {score:.1f}/100 ({level}). "
            f"This is calculated from {len(cko.risks)} risks and {len(cko.conflicts)} conflicts detected.",
            {"score": score, "risks": len(cko.risks), "conflicts": len(cko.conflicts)}
        )

    def _handle_conflicts(self, cko, q):
        conflicts = cko.conflicts
        if not conflicts:
            return ("No conflicts or contradictions were detected in this document.", {"conflicts": []})
        high = [c for c in conflicts if str(c.get("severity", "")).lower() == "high"]
        return (
            f"There are {len(conflicts)} conflicts detected, {len(high)} of which are high severity. "
            f"Most recent: '{conflicts[0].get('description', '')}'.",
            {"conflicts": conflicts}
        )

    def _handle_departments(self, cko, q):
        depts = cko.departments
        if not depts:
            return ("No specific departments were identified in this document.", {"departments": []})
        names = [d.get("department") or d.get("name", "Unknown") for d in depts]
        return (
            f"{len(depts)} departments are impacted: {', '.join(names[:5])}{'...' if len(names) > 5 else ''}.",
            {"departments": depts}
        )

    def _handle_recommendations(self, cko, q):
        recs = cko.recommendations
        if not recs:
            return ("No specific recommendations have been generated yet. Try uploading a document first.", {"recommendations": []})
        high_prio = [r for r in recs if str(r.get("priority", "")).lower() == "high"]
        return (
            f"There are {len(recs)} recommendations. "
            f"{len(high_prio)} are high priority. Top recommendation: '{recs[0].get('text', recs[0].get('action', ''))[:150]}'.",
            {"recommendations": recs}
        )

    def _handle_explain(self, cko, q):
        critical = [r for r in cko.risks if str(r.get("severity", "")).lower() in ("critical", "high")]
        score = cko.compliance_score
        explanation = (
            f"The compliance score of {score:.1f} is driven by {len(cko.risks)} detected risks "
            f"and {len(cko.conflicts)} conflicts. {len(critical)} items are critical or high severity, "
            f"which most heavily penalise the score. Each mandatory obligation that lacks evidence "
            f"coverage contributes to risk accumulation."
        )
        return (explanation, {"high_severity_items": critical, "score": score})

    def _handle_counts(self, cko, q):
        counts = {
            "obligations": len(cko.obligations),
            "risks": len(cko.risks),
            "deadlines": len(cko.deadlines),
            "conflicts": len(cko.conflicts),
            "departments": len(cko.departments),
            "recommendations": len(cko.recommendations),
        }
        lines = ", ".join(f"{v} {k}" for k, v in counts.items())
        return (f"Document totals: {lines}.", {"counts": counts})

    def _handle_fallback(self, cko, q):
        suggestions = [
            "summarize the document",
            "list all obligations",
            "what are the deadlines?",
            "show high risks",
            "what is the compliance score?",
        ]
        return (
            f"I couldn't find a specific answer for that query. "
            f"Try asking: {' | '.join(suggestions)}",
            {}
        )
