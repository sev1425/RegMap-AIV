"""Bug 3 verification: Silent OCR fallback fabricates content."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ai.loader import UniversalDocumentLoader
from models.compliance import ComplianceKnowledgeObject
from services.analysis_service import AnalysisService

# We'll mock pytesseract to raise an Exception
import pytesseract
def mock_image_to_string(image):
    raise Exception("Mock OCR Failure")
pytesseract.image_to_string = mock_image_to_string

# We need a dummy image file for the loader to open
from PIL import Image
img_path = os.path.join(os.path.dirname(__file__), "test_dummy.png")
Image.new('RGB', (10, 10)).save(img_path)

print("=== OCR FAILURE TEST ===")
loader = UniversalDocumentLoader(img_path)
text = loader.load()
print("Returned text:", text)

assert "CCI" not in text, "FAIL: Fabricated content (CCI) found"
assert "Digital Markets" not in text, "FAIL: Fabricated content (Digital Markets) found"
assert text.startswith("[OCR_UNAVAILABLE]"), "FAIL: Text does not start with [OCR_UNAVAILABLE]"

print("PASS: loader returns error message, no fabricated content")

# Test analysis service warning populating
service = AnalysisService()
cko = service.analyze_document(img_path)
print("Warnings:", cko.warnings)
assert len(cko.warnings) > 0, "FAIL: warnings array is empty"
assert "OCR unavailable" in cko.warnings[0], "FAIL: Expected OCR warning"

print("PASS: Analysis service populates warnings")
print("ALL BUG 3 TESTS PASSED")

# Cleanup
if os.path.exists(img_path):
    os.remove(img_path)
