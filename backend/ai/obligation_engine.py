# ==========================================================
# REGMAP AI ENTERPRISE
# OBLIGATION INTELLIGENCE ENGINE
# ==========================================================

import re
import hashlib
import logging

logger = logging.getLogger(__name__)

class ObligationEngine:

    def __init__(self):
        self.use_spacy = False
        self.use_semantics = False
        self.nlp = None
        self.encoder = None
        self.seed_embeddings = None

        # Try loading spaCy
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
            self.use_spacy = True
        except Exception as e:
            logger.warning(f"Failed to load spaCy 'en_core_web_sm': {e}. Falling back to regex sentence splitting.")

        # Try loading Sentence-Transformers
        try:
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
            
            # Seed phrases for semantic matching
            self.seed_phrases = [
                "mandatory compliance requirement", 
                "regulatory obligation", 
                "shall be required to", 
                "must submit report"
            ]
            self.seed_embeddings = self.encoder.encode(self.seed_phrases, convert_to_tensor=True)
            self.use_semantics = True
        except Exception as e:
            logger.warning(f"Failed to load SentenceTransformer 'all-MiniLM-L6-v2': {e}. Disabling semantic matching.")

        self.keywords = {
            "Mandatory": [
                "shall",
                "must",
                "mandatory",
                "required",
                "required to"
            ],
            "Advisory": [
                "should",
                "recommended",
                "may"
            ],
            "Operational": [
                "submit",
                "maintain",
                "report",
                "provide",
                "ensure",
                "comply"
            ]
        }

    # ======================================================
    # Analyze Obligations
    # ======================================================

    def analyze(self, cko):
        text = cko.raw_text

        # Sentence Splitter Fallback
        if self.use_spacy:
            doc = self.nlp(text)
            sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
        else:
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

        obligations = []
        missed_sentences = []

        for sentence in sentences:
            lower = sentence.lower()
            matched = False

            for category, words in self.keywords.items():
                if any(word in lower for word in words):
                    obligation_id = hashlib.sha1(
                        re.sub(r'[.!?]+$', '', sentence).lower().encode("utf-8")
                    ).hexdigest()[:10]

                    confidence = 1.0  # Default fallback confidence
                    if self.use_semantics:
                        from sentence_transformers import util
                        emb = self.encoder.encode(sentence, convert_to_tensor=True)
                        cos_scores = util.cos_sim(emb, self.seed_embeddings)[0]
                        confidence = round(float(cos_scores.max()), 4)

                    obligations.append({
                        "id": obligation_id,
                        "category": category,
                        "text": sentence,
                        "priority": "High" if category == "Mandatory" else "Medium",
                        "confidence": confidence
                    })
                    matched = True
                    break
            
            if not matched:
                missed_sentences.append(sentence)
                
        # Semantic matching for missed sentences
        if self.use_semantics:
            from sentence_transformers import util
            for sentence in missed_sentences:
                emb = self.encoder.encode(sentence, convert_to_tensor=True)
                cos_scores = util.cos_sim(emb, self.seed_embeddings)[0]
                max_score = float(cos_scores.max())
                
                if max_score > 0.45:
                    obligation_id = hashlib.sha1(
                        re.sub(r'[.!?]+$', '', sentence).lower().encode("utf-8")
                    ).hexdigest()[:10]
                    
                    obligations.append({
                        "id": obligation_id,
                        "category": "Inferred",
                        "text": sentence,
                        "priority": "Medium",
                        "confidence": round(max_score, 4)
                    })
                    
        # Re-rank by confidence
        obligations.sort(key=lambda x: x.get("confidence", 0), reverse=True)

        cko.obligations = obligations

        print(
            f"[AI] Obligation Engine Completed "
            f"({len(obligations)} obligations)"
        )

        return cko