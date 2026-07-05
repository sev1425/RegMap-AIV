"""Bug 2 verification: content-based IDs for obligations and risks."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from models.compliance import ComplianceKnowledgeObject
from ai.obligation_engine import ObligationEngine
from ai.risk_engine import RiskEngine
from ai.comparison_engine import RegulationComparisonEngine

# Build two CKOs with identical obligations in different order
# Use sentences that split cleanly (each ends with ". " followed by next)
a = ComplianceKnowledgeObject()
a.raw_text = "Banks shall do X. Banks shall do Y. End of document"
ObligationEngine().analyze(a)

b = ComplianceKnowledgeObject()
b.raw_text = "Banks shall do Y. Banks shall do X. End of document"
ObligationEngine().analyze(b)

print("=== OBLIGATION REORDER TEST ===")
print("a.obligations:", [(o["id"], o["text"]) for o in a.obligations])
print("b.obligations:", [(o["id"], o["text"]) for o in b.obligations])

comp = RegulationComparisonEngine()
result = comp.compare(a, b)
print("Added:", len(result["added_obligations"]))
print("Removed:", len(result["removed_obligations"]))
print("Modified:", len(result["modified_obligations"]))
assert len(result["added_obligations"]) == 0, f"FAIL: should be 0 added, got {len(result['added_obligations'])}"
assert len(result["removed_obligations"]) == 0, f"FAIL: should be 0 removed, got {len(result['removed_obligations'])}"
assert len(result["modified_obligations"]) == 0, f"FAIL: should be 0 modified, got {len(result['modified_obligations'])}"
print("PASS: obligation reorder test")

# Test 2: Risks in different order should also match
RiskEngine().analyze(a)
RiskEngine().analyze(b)
print()
print("=== RISK REORDER TEST ===")
print("a.risks ids:", [r["id"] for r in a.risks])
print("b.risks ids:", [r["id"] for r in b.risks])
result2 = comp.compare(a, b)
print("Risk added:", len(result2["risk_changes"]["added"]))
print("Risk removed:", len(result2["risk_changes"]["removed"]))
assert len(result2["risk_changes"]["added"]) == 0, "FAIL: should be 0 risk added"
assert len(result2["risk_changes"]["removed"]) == 0, "FAIL: should be 0 risk removed"
print("PASS: risk reorder test")

# Test 3: Genuine change should be detected
print()
print("=== GENUINE CHANGE TEST ===")
c = ComplianceKnowledgeObject()
c.raw_text = "Banks shall do X. Banks shall do Z. End of document"
ObligationEngine().analyze(c)
RiskEngine().analyze(c)
result3 = comp.compare(a, c)
print("Added:", len(result3["added_obligations"]))
print("Removed:", len(result3["removed_obligations"]))
print("Modified:", len(result3["modified_obligations"]))
assert len(result3["added_obligations"]) == 1, f"FAIL: expected 1 added, got {len(result3['added_obligations'])}"
assert len(result3["removed_obligations"]) == 1, f"FAIL: expected 1 removed, got {len(result3['removed_obligations'])}"
print("PASS: genuine change test")
print()
print("ALL BUG 2 TESTS PASSED")
