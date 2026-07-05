from database.database import RegMapDatabase
from ai.knowledge_graph import KnowledgeGraphEngine
from services.cko_utils import build_cko_from_dict


class GraphService:
    def __init__(self):
        self.db = RegMapDatabase()
        self.engine = KnowledgeGraphEngine()

    def get_graph(self):
        cko_data = self.db.get_latest_cko_json()
        if not cko_data:
            return {"status": "empty", "message": "No analysis found. Upload a regulation first."}

        graph = cko_data.get("knowledge_graph") or {}
        if not graph.get("nodes"):
            cko = build_cko_from_dict(cko_data)
            cko = self.engine.analyze(cko)
            graph = cko.knowledge_graph

        return {"status": "success", "data": graph}
