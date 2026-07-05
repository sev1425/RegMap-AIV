# ==========================================================
# REGMAP AI ENTERPRISE
# COPILOT SERVICE — Claude primary, offline fallback
# ==========================================================

import json
from database.database import RegMapDatabase
from ai.claude_engine import ClaudeCopilotEngine
from ai.copilot_engine import OfflineAICopilotEngine
from ai.search_engine import EnterpriseSearchEngine
from models.compliance import ComplianceKnowledgeObject


class CopilotService:

    def __init__(self):
        self.db = RegMapDatabase()
        self.claude_copilot = ClaudeCopilotEngine()
        self.offline_copilot = OfflineAICopilotEngine()
        self.searcher = EnterpriseSearchEngine()
        mode = "Claude API" if self.claude_copilot.available else "Offline NLP"
        print(f"[CopilotService] Mode: {mode}")

    def _build_cko_from_dict(self, data: dict) -> ComplianceKnowledgeObject:
        cko = ComplianceKnowledgeObject()
        for field, value in data.items():
            if hasattr(cko, field):
                setattr(cko, field, value)
        return cko

    def query(self, user_query: str, history: list) -> dict:
        cko_data = self.db.get_latest_cko_json()

        if not cko_data:
            return {
                "status": "empty",
                "query": user_query,
                "response": "No regulatory document has been analyzed yet. Please upload a circular via the Regulations page first.",
                "confidence": 0,
                "citations": [],
                "suggested_questions": [
                    "What is the compliance score?",
                    "List all high-risk obligations",
                    "What are the upcoming deadlines?",
                    "Which departments are most affected?"
                ],
                "offline_mode": True
            }

        cko = self._build_cko_from_dict(cko_data)

        # Try Claude first
        result = None
        offline_mode = True

        if self.claude_copilot.available:
            result = self.claude_copilot.query(cko, user_query, history)
            if result:
                offline_mode = False

        # Fall back to offline
        if not result:
            offline_result = self.offline_copilot.query(cko, user_query)
            result = {
                "response": offline_result["response"],
                "confidence": offline_result.get("confidence", 70),
                "engine": "Offline NLP"
            }

        # Keyword search for citations
        search_result = self.searcher.search(cko, user_query)
        citations = [
            f"{r['category']}: {str(r['match'])[:120]}..."
            for r in search_result.get("results", [])[:3]
        ]

        return {
            "status": "success",
            "query": user_query,
            "response": result["response"],
            "confidence": result.get("confidence", 80),
            "citations": citations,
            "suggested_questions": self._get_suggestions(user_query, cko),
            "offline_mode": offline_mode,
            "engine": result.get("engine", "Offline NLP")
        }

    def _get_suggestions(self, query: str, cko: ComplianceKnowledgeObject) -> list:
        q = query.lower()
        base = [
            "What is the overall compliance score?",
            "Which MAPs are marked Critical?",
            "What is the largest penalty exposure?",
        ]
        if "risk" in q:
            return ["Which departments own the highest risks?", "What is the risk score?"] + base[:1]
        if "deadline" in q:
            return ["Which obligation has the shortest deadline?", "Which department owns the nearest deadline?"] + base[:1]
        if "map" in q or "action" in q:
            return ["How many MAPs are pending?", "Which MAP has the highest penalty?"] + base[:1]
        return base
