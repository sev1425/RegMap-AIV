"""Bug 6 verification: Hash-chained audit trail."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database.database import RegMapDatabase
from ai.orchestrator import RegMapAIEngine

db = RegMapDatabase()
# Clear audit trail for clean test
cursor = db.connection.cursor()
cursor.execute("DELETE FROM audit_trail")
db.connection.commit()
cursor.close()

engine = RegMapAIEngine()

# Process doc 1
print("Processing Doc 1...")
doc1 = "Reserve Bank of India requires the Treasury department to submit compliance reports."
engine.analyze(doc1)

# Process doc 2
print("Processing Doc 2...")
doc2 = "Banks shall maintain records."
engine.analyze(doc2)

print("\n=== AUDIT TRAIL TEST ===")
trail = db.get_audit_trail()
print(f"Total entries: {len(trail)}")
assert len(trail) >= 2, "FAIL: Should have at least 2 entries"

entry1, entry2 = trail[-2], trail[-1]
print("Entry 1 Hash:", entry1["hash"])
print("Entry 2 Prev:", entry2["prev_hash"])
assert entry1["hash"] == entry2["prev_hash"], "FAIL: Hash chain broken"

is_valid, msg = db.verify_chain()
assert is_valid, f"FAIL: Chain should be valid, got: {msg}"
print("PASS: Valid chain verified")

# Tamper with the database
print("Tampering with DB...")
cursor = db.connection.cursor()
cursor.execute("UPDATE audit_trail SET description = 'Tampered' WHERE id = ?", (entry1["id"],))
db.connection.commit()
cursor.close()

is_valid, msg = db.verify_chain()
assert not is_valid, "FAIL: Tampering not detected"
assert "hash mismatch" in msg, "FAIL: Wrong error message for tampering"
print("PASS: Tampering detected:", msg)

print("ALL BUG 6 TESTS PASSED")
