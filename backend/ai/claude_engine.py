# ==========================================================
# REGMAP AI ENTERPRISE
# CLAUDE AI ENGINE — Primary Intelligence Layer
# Uses Anthropic Claude API for superior analysis quality.
# Falls back to offline pipeline if API unavailable.
# ==========================================================

import json
import os
import logging
import re
import datetime

logger = logging.getLogger(__name__)


ANALYSIS_SYSTEM_PROMPT = """You are RegMap AI, the world's most advanced regulatory compliance analyst for Indian banking.

You analyze regulatory circulars from RBI, SEBI, MCA, and IBA with expert precision.

You always respond with ONLY valid JSON — no preamble, no markdown, no explanation.

Your JSON must follow the exact schema provided. All fields are required."""


ANALYSIS_PROMPT_TEMPLATE = """Analyze this regulatory document and return a JSON object with EXACTLY this structure:

{{
  "title": "document title",
  "issuer": "RBI | SEBI | MCA | IBA | other",
  "document_type": "Master Direction | Circular | Notification | Guidelines | other",
  "summary": "2-3 sentence executive summary of what this regulation requires",
  "compliance_score": 100,
  "obligations": [
    {{
      "id": "OBL-001",
      "text": "exact obligation text from document",
      "category": "Mandatory | Advisory | Operational",
      "priority": "Critical | High | Medium | Low",
      "department": "IT / CISO | Legal / Compliance | Compliance | Risk | HR / Legal | Operations | Finance | Treasury",
      "confidence": 0.95
    }}
  ],
  "maps": [
    {{
      "id": "MAP-001",
      "obligation_id": "OBL-001",
      "obligation_text": "exact obligation text",
      "department": "primary responsible department",
      "priority": "Critical | High | Medium | Low",
      "deadline_label": "30 days | 60 days | Immediate | Annual | etc",
      "deadline_date": "DD Mon YYYY",
      "days_to_deadline": 30,
      "evidence_required": "specific evidence document 1; specific evidence document 2",
      "penalty_exposure": "₹X Cr under Regulation Y",
      "status": "Pending"
    }}
  ],
  "risks": [
    {{
      "id": "RISK-001",
      "label": "RISK-001",
      "severity": "Critical | High | Medium | Low",
      "source": "obligation text that creates this risk",
      "source_obligation_id": "OBL-001",
      "penalty_exposure": "specific rupee penalty",
      "regulation_reference": "specific act/section",
      "recommendation": "specific actionable recommendation",
      "status": "Open"
    }}
  ],
  "deadlines": [
    {{
      "deadline": "YYYY-MM-DD",
      "deadline_text": "description of what must be done",
      "date_expression": "30 days from circular date",
      "days_remaining": 30,
      "status": "Pending",
      "priority": "High"
    }}
  ],
  "departments": [
    {{
      "department": "department name",
      "confidence": 85,
      "status": "Affected",
      "obligation_count": 3
    }}
  ],
  "conflicts": [],
  "recommendations": [
    {{
      "id": "REC-001",
      "title": "recommendation title",
      "priority": "Critical | High | Medium",
      "department": "responsible department",
      "recommendation": "specific action to take",
      "confidence": 90,
      "status": "Pending"
    }}
  ]
}}

Rules:
- Extract EVERY obligation using shall/must/required/mandatory language
- Generate ONE MAP per obligation
- Estimate realistic Indian regulatory penalty amounts
- Department routing must be specific and accurate
- Deadline must be extracted from text; use 30 days as default if not specified
- Compliance score starts at 100 (perfect) — no deductions until evidence is uploaded

DOCUMENT TO ANALYZE:
{text}"""


class ClaudeAnalysisEngine:
    """
    Primary AI engine using Anthropic Claude API.
    Replaces the first 12 pipeline stages with a single, high-quality Claude call.
    """

    def __init__(self):
        self.available = False
        self.client = None
        self.model = "claude-sonnet-4-6"

        try:
            import anthropic
            api_key = os.environ.get("ANTHROPIC_API_KEY", "")
            if api_key:
                self.client = anthropic.Anthropic(api_key=api_key)
                self.available = True
                logger.info("[ClaudeEngine] Anthropic API ready — using Claude for analysis")
            else:
                logger.warning("[ClaudeEngine] ANTHROPIC_API_KEY not set — falling back to offline pipeline")
        except ImportError:
            logger.warning("[ClaudeEngine] anthropic package not installed — falling back to offline pipeline")

    def analyze(self, cko):
        if not self.available:
            return cko  # Let offline pipeline handle it

        try:
            text = cko.raw_text[:12000]  # Claude handles large context; limit for cost
            prompt = ANALYSIS_PROMPT_TEMPLATE.format(text=text)

            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                system=ANALYSIS_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}]
            )

            raw = response.content[0].text.strip()

            # Strip markdown fences if present
            raw = re.sub(r'^```json\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)

            data = json.loads(raw)
            self._populate_cko(cko, data)

            print(f"[ClaudeEngine] Analysis complete — "
                  f"{len(cko.obligations)} obligations, {len(cko.maps)} MAPs")
            return cko

        except Exception as e:
            logger.error(f"[ClaudeEngine] API call failed: {e}. Falling back to offline pipeline.")
            cko._claude_failed = True
            return cko

    def _populate_cko(self, cko, data: dict):
        """Map Claude JSON response onto the CKO."""
        today = datetime.date.today()

        cko.title = data.get("title", cko.title or "Regulatory Document")
        cko.issuer = data.get("issuer", cko.issuer or "")
        cko.document_type = data.get("document_type", cko.document_type or "")
        cko.summary = data.get("summary", cko.summary or "")
        cko.compliance_score = float(data.get("compliance_score", 100.0))

        # Obligations
        obligations = data.get("obligations", [])
        for i, o in enumerate(obligations, 1):
            o.setdefault("id", f"OBL-{i:03}")
        cko.obligations = obligations

        # MAPs — add created_at and category from obligation
        maps = data.get("maps", [])
        for i, m in enumerate(maps, 1):
            m.setdefault("id", f"MAP-{i:03}")
            m.setdefault("status", "Pending")
            m.setdefault("created_at", datetime.datetime.now().isoformat())
            # Link obligation category
            obl = next((o for o in obligations if o.get("id") == m.get("obligation_id")), {})
            m.setdefault("category", obl.get("category", "Mandatory"))
            m.setdefault("confidence", obl.get("confidence", 0.9))
        cko.maps = maps

        # Risks
        cko.risks = data.get("risks", [])

        # Deadlines — fix date format
        deadlines = data.get("deadlines", [])
        for d in deadlines:
            if not d.get("deadline"):
                days = d.get("days_remaining", 30)
                d["deadline"] = (today + datetime.timedelta(days=days)).isoformat()
        cko.deadlines = deadlines

        # Departments
        cko.departments = data.get("departments", [])

        # Conflicts + Recommendations
        cko.conflicts = data.get("conflicts", [])
        cko.recommendations = data.get("recommendations", [])

        # Derive risk score
        high = sum(1 for r in cko.risks if r.get("severity") in ("Critical", "High"))
        cko.risk_score = min(100, high * 5.0)
        cko.priority = "Critical" if high > 5 else "High" if high > 2 else "Medium"


class ClaudeCopilotEngine:
    """
    Claude-powered conversational copilot for compliance Q&A.
    Dramatically better than keyword matching.
    """

    SYSTEM = """You are RegMap AI Copilot, an expert regulatory compliance assistant for Indian banks.

You have access to a fully analyzed regulatory document (CKO — Compliance Knowledge Object).

Answer questions concisely and accurately based ONLY on the CKO data provided.
Focus on actionable insights. Use specific numbers, dates, and department names.
If a question is outside the analyzed document, say so clearly.
Keep responses under 150 words unless asked for detail.
Never fabricate data."""

    def __init__(self):
        self.available = False
        self.client = None
        self.model = "claude-sonnet-4-6"

        try:
            import anthropic
            api_key = os.environ.get("ANTHROPIC_API_KEY", "")
            if api_key:
                self.client = anthropic.Anthropic(api_key=api_key)
                self.available = True
        except ImportError:
            pass

    def query(self, cko, user_query: str, history: list = None) -> dict:
        if not self.available:
            return None  # Caller falls back to offline engine

        try:
            # Build compact CKO context
            context = self._build_context(cko)

            # Build message history
            messages = []
            for msg in (history or [])[-6:]:  # Last 3 exchanges
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

            messages.append({
                "role": "user",
                "content": f"CKO Data:\n{context}\n\nQuestion: {user_query}"
            })

            response = self.client.messages.create(
                model=self.model,
                max_tokens=300,
                system=self.SYSTEM,
                messages=messages
            )

            answer = response.content[0].text.strip()
            return {
                "response": answer,
                "confidence": 95,
                "engine": "Claude claude-sonnet-4-6",
                "offline_mode": False
            }

        except Exception as e:
            logger.error(f"[ClaudeCopilot] Failed: {e}")
            return None

    def _build_context(self, cko) -> str:
        lines = [
            f"Document: {cko.title} | Issuer: {cko.issuer} | Type: {cko.document_type}",
            f"Summary: {cko.summary}",
            f"Compliance Score: {cko.compliance_score:.0f}/100",
            f"Total Obligations: {len(cko.obligations)} | MAPs: {len(cko.maps)} | Risks: {len(cko.risks)}",
            f"Deadlines: {len(cko.deadlines)} | Departments Affected: {len(cko.departments)}",
        ]

        if cko.maps:
            lines.append("\nTop MAPs:")
            for m in cko.maps[:6]:
                lines.append(f"  {m.get('id')} | {m.get('priority')} | {m.get('department')} | "
                             f"Due: {m.get('deadline_label')} | {m.get('penalty_exposure', '')}")

        if cko.risks:
            high_risks = [r for r in cko.risks if r.get("severity") in ("Critical", "High")]
            lines.append(f"\nHigh/Critical Risks ({len(high_risks)}):")
            for r in high_risks[:4]:
                lines.append(f"  {r.get('label')} | {r.get('severity')} | Penalty: {r.get('penalty_exposure', 'N/A')}")

        if cko.deadlines:
            lines.append("\nDeadlines:")
            for d in cko.deadlines[:4]:
                lines.append(f"  {d.get('deadline_text', '')} — {d.get('days_remaining', '?')} days")

        return "\n".join(lines)
