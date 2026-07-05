from ai.loader import UniversalDocumentLoader

# ==========================================
# Test PDF Loader
# ==========================================

pdf_path = "uploads/sample.pdf"

loader = UniversalDocumentLoader(pdf_path)

text = loader.load()

print("\n")
print("=" * 70)
print("FIRST 1000 CHARACTERS")
print("=" * 70)

print(text[:1000])

print("\n")
print("=" * 70)
print("TOTAL CHARACTERS")
print("=" * 70)

print(len(text))