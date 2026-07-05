import time
from typing import Dict, Any, List
from models.compliance import ComplianceKnowledgeObject

class EnterpriseSearchEngine:
    """
    Enterprise Search Engine
    Searches inside Entities, Obligations, Departments, Risks, Evidence,
    Recommendations, and Deadlines. Returns ranked results.
    """
    
    def __init__(self):
        self.engine_name = "EnterpriseSearchEngine"

    def search(self, cko: ComplianceKnowledgeObject, query: str) -> Dict[str, Any]:
        """
        Executes a deep search across the Compliance Knowledge Object.
        """
        start_time = time.time()
        q = query.lower()
        
        results = []
        
        # Helper to search a list of dicts
        def _search_collection(collection: List[Dict], category: str, weight: int = 1):
            for item in collection:
                if isinstance(item, dict):
                    # Convert dict values to string for simple text search
                    item_text = " ".join([str(v).lower() for k, v in item.items()])
                    if q in item_text:
                        # Basic ranking based on term frequency
                        score = item_text.count(q) * weight
                        results.append({
                            "category": category,
                            "match": item,
                            "relevance_score": score
                        })

        # Search across all primary data structures
        
        # Entities (Dict[str, List] in CKO)
        for entity_type, entity_list in cko.entities.items():
            for entity in entity_list:
                if q in str(entity).lower():
                    results.append({
                        "category": f"Entity ({entity_type})",
                        "match": entity,
                        "relevance_score": 2
                    })

        _search_collection(cko.obligations, "Obligation", weight=3)
        _search_collection(cko.departments, "Department", weight=2)
        _search_collection(cko.risks, "Risk", weight=3)
        _search_collection(cko.evidence, "Evidence", weight=2)
        _search_collection(cko.recommendations, "Recommendation", weight=3)
        _search_collection(cko.deadlines, "Deadline", weight=2)
        
        # Sort results by relevance score descending
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        elapsed_time = time.time() - start_time
        
        return {
            "query": query,
            "total_results": len(results),
            "results": results,
            "search_time_seconds": round(elapsed_time, 4)
        }
