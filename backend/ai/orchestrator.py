# ==========================================================
# REGMAP AI ENTERPRISE
# AI ORCHESTRATOR — Claude Primary + Offline Fallback
# ==========================================================

import time
from models.compliance import ComplianceKnowledgeObject
from ai.pipeline import PipelineManager

# Claude primary engine
from ai.claude_engine import ClaudeAnalysisEngine

# Offline fallback pipeline
from ai.entity_engine import EntityEngine
from ai.obligation_engine import ObligationEngine
from ai.deadline_engine import DeadlineEngine
from ai.department_engine import DepartmentEngine
from ai.decision_engine import DecisionEngine
from ai.risk_engine import RiskEngine
from ai.map_engine import MAPEngine
from ai.evidence_engine import EvidenceEngine
from ai.conflict_engine import ConflictEngine
from ai.recommendation_engine import RecommendationEngine
from ai.knowledge_graph import KnowledgeGraphEngine
from ai.reasoning_engine import ComplianceReasoningEngine
from ai.executive_engine import ExecutiveEngine
from ai.explainable_engine import ExplainableAIEngine
from ai.timeline_engine import EnterpriseTimelineEngine
from ai.analytics_engine import EnterpriseAnalyticsEngine
from ai.report_engine import EnterpriseReportEngine


class RegMapAIEngine:

    def __init__(self):
        print("[SYSTEM] RegMap AI Enterprise Initialized")

        # Primary: Claude API
        self.claude = ClaudeAnalysisEngine()

        # Offline fallback: full 17-stage pipeline
        self.offline_pipeline = PipelineManager([
            EntityEngine(),
            ObligationEngine(),
            DeadlineEngine(),
            DepartmentEngine(),
            DecisionEngine(),
            RiskEngine(),
            MAPEngine(),
            EvidenceEngine(),
            ConflictEngine(),
            RecommendationEngine(),
            KnowledgeGraphEngine(),
            ComplianceReasoningEngine(),
            ExecutiveEngine(),
            ExplainableAIEngine(),
        ])

        # Post-processing always runs (analytics, timeline, report)
        self.post_pipeline = PipelineManager([
            EnterpriseTimelineEngine(),
            EnterpriseAnalyticsEngine(),
            EnterpriseReportEngine(),
        ])

        mode = "Claude API + Offline Fallback" if self.claude.available else "Offline NLP Pipeline"
        print(f"[SYSTEM] Analysis Mode: {mode}")

    def create_cko(self):
        return ComplianceKnowledgeObject()

    @staticmethod
    def _title_from_filename(filename: str) -> str:
        """Turn 'RBI_Master_Direction-2026.pdf' into 'RBI Master Direction 2026'."""
        import re
        from pathlib import Path

        stem = Path(filename).stem
        cleaned = re.sub(r"[_\-]+", " ", stem)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned[:120] if cleaned else "Regulatory Document"

    def analyze(self, document_text: str, source_filename: str = None):
        print()
        print("=" * 70)
        print("REGMAP AI ENTERPRISE")
        print("=" * 70)

        start = time.time()

        cko = self.create_cko()
        cko.raw_text = document_text
        cko.source_filename = source_filename or ""

        # Derive a reliable default title.
        # Priority: cleaned-up source filename (always available on file
        # upload, reflects exactly what the user uploaded) > first
        # non-empty line of the document (used for pasted text where no
        # filename exists). Claude may still override this with a better
        # extracted title below — this is only the fallback.
        if source_filename:
            cko.title = self._title_from_filename(source_filename)
        else:
            for line in document_text.splitlines():
                if line.strip():
                    cko.title = line.strip()[:120]
                    break

        # ── Stage 1: Claude Analysis (if available) ──────────────────────
        if self.claude.available:
            print("[AI] Running Claude claude-sonnet-4-6 analysis...")
            cko = self.claude.analyze(cko)

        # ── Stage 2: Offline fallback if Claude failed/unavailable ───────
        if not self.claude.available or getattr(cko, '_claude_failed', False):
            print("[AI] Running offline NLP pipeline...")
            cko = self.offline_pipeline.run(cko)
        else:
            # Still run knowledge graph + explainability even when Claude succeeds
            cko = KnowledgeGraphEngine().analyze(cko)
            cko = ExplainableAIEngine().analyze(cko)

        # ── Stage 3: Post-processing (always) ────────────────────────────
        print("[AI] Running post-processing (timeline, analytics, report)...")
        cko = self.post_pipeline.run(cko)

        elapsed = round(time.time() - start, 2)
        cko.processing_time = elapsed

        print(f"[DONE] Analysis complete in {elapsed}s | "
              f"{len(cko.obligations)} obligations | {len(cko.maps)} MAPs | "
              f"Score: {cko.compliance_score:.0f}/100")
        print("=" * 70)

        return cko
