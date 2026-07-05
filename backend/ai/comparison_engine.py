import time
import re
from typing import Dict, Any, List
from models.compliance import ComplianceKnowledgeObject

def _normalize_text(t):
    return re.sub(r'[.!?]+$', '', (t or "").strip()).lower()

def _hash_items(items, key_field="id"):
    return {str(item.get(key_field, idx)): item for idx, item in enumerate(items) if isinstance(item, dict)}

class RegulationComparisonEngine:
    """
    Regulation Comparison Engine
    Compares two ComplianceKnowledgeObjects (CKO) to detect added, removed, 
    and modified obligations, risk changes, and department impacts.
    """
    
    def __init__(self):
        self.engine_name = "RegulationComparisonEngine"

    def compare(self, cko_old: ComplianceKnowledgeObject, cko_new: ComplianceKnowledgeObject) -> Dict[str, Any]:
        """
        Compares two versions of regulatory documents represented as CKOs.
        """
        start_time = time.time()
        
        old_obs = _hash_items(cko_old.obligations, "id")
        new_obs = _hash_items(cko_new.obligations, "id")
        
        added_obligations = []
        removed_obligations = []
        modified_obligations = []
        
        for ob_id, ob_new in new_obs.items():
            if ob_id not in old_obs:
                added_obligations.append(ob_new)
            elif (_normalize_text(old_obs[ob_id].get("text")) != _normalize_text(ob_new.get("text"))
                  or old_obs[ob_id].get("category") != ob_new.get("category")
                  or old_obs[ob_id].get("priority") != ob_new.get("priority")):
                modified_obligations.append({
                    "id": ob_id,
                    "old": old_obs[ob_id],
                    "new": ob_new
                })
                
        for ob_id, ob_old in old_obs.items():
            if ob_id not in new_obs:
                removed_obligations.append(ob_old)

        old_risks = _hash_items(cko_old.risks, "id")
        new_risks = _hash_items(cko_new.risks, "id")
        
        risk_changes = {
            "added": [r for r_id, r in new_risks.items() if r_id not in old_risks],
            "removed": [r for r_id, r in old_risks.items() if r_id not in new_risks]
        }
        
        department_impact = []
        old_dept_names = set(d.get("department") for d in cko_old.departments if isinstance(d, dict))
        new_dept_names = set(d.get("department") for d in cko_new.departments if isinstance(d, dict))
        all_depts = old_dept_names | new_dept_names
                        
        for dept in all_depts:
            if dept:
                department_impact.append({
                    "department": dept,
                    "impact_level": "High" if (dept in new_dept_names and dept not in old_dept_names) else "Low"
                })

        elapsed_time = time.time() - start_time
        
        comparison_report = {
            "metadata": {
                "old_document_title": cko_old.title,
                "new_document_title": cko_new.title,
                "comparison_time_seconds": round(elapsed_time, 4)
            },
            "added_obligations": added_obligations,
            "removed_obligations": removed_obligations,
            "modified_obligations": modified_obligations,
            "risk_changes": risk_changes,
            "department_impact": department_impact,
            "summary": f"Detected {len(added_obligations)} added obligations, {len(removed_obligations)} removed obligations, and {len(modified_obligations)} modified obligations."
        }
        
        return comparison_report
