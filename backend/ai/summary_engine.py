import time
from models.compliance import ComplianceKnowledgeObject

class SummaryEngine:
    """
    Summary Engine
    Generates a high-level executive summary of the document based on the initial text.
    """
    
    def __init__(self):
        self.engine_name = "SummaryEngine"

    def analyze(self, cko: ComplianceKnowledgeObject) -> ComplianceKnowledgeObject:
        start_time = time.time()
        
        # In a real enterprise system, this would use an LLM or NLP technique
        # For offline offline, we do a heuristic summary or extract key sentences
        text = cko.raw_text
        if not text:
            cko.summary = "No text provided for analysis."
        else:
            sentences = [s.strip() for s in text.split('.') if s.strip()]
            summary_sentences = sentences[:3]
            cko.summary = ". ".join(summary_sentences) + "." if summary_sentences else "Document analyzed successfully."
            
        elapsed_time = time.time() - start_time
        cko.processing_time += elapsed_time
        cko.engine_history.append(f"{self.engine_name} ({elapsed_time:.4f}s)")
        
        return cko
