# ==========================================================
# REGMAP AI ENTERPRISE
# ANALYSIS SERVICE
# ==========================================================

from ai.loader import UniversalDocumentLoader
from ai.orchestrator import RegMapAIEngine
from database.database import RegMapDatabase


class AnalysisService:

    def __init__(self):

        self.engine = RegMapAIEngine()

        self.database = RegMapDatabase()

    # ======================================================
    # Analyze Document
    # ======================================================

    def analyze_document(self, filepath, source_filename=None):

        print("[SERVICE] Loading document...")

        loader = UniversalDocumentLoader(filepath)

        text = loader.load()

        print("[SERVICE] Running AI Pipeline...")

        cko = self.engine.analyze(text, source_filename=source_filename)

        # Surface OCR warnings so the frontend can inform the user
        if isinstance(text, str):
            if text.startswith("[OCR_UNAVAILABLE]"):
                cko.warnings.append(
                    "OCR unavailable — analysis may be incomplete. "
                    "Please upload a text-based document or install Tesseract OCR."
                )
            elif text.startswith("[OCR_WARNING]"):
                cko.warnings.append(
                    "No readable text was found in the uploaded image. "
                    "Analysis may be incomplete."
                )

        print("[SERVICE] Saving Analysis...")

        self.database.save_analysis(cko)

        return cko