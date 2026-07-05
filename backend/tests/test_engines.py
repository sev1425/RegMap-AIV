import pytest
import sys
import os

# Ensure backend is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.compliance import ComplianceKnowledgeObject
from ai.obligation_engine import ObligationEngine
from ai.risk_engine import RiskEngine
from ai.conflict_engine import ConflictEngine
from ai.deadline_engine import DeadlineEngine
from ai.executive_engine import ExecutiveEngine

def test_obligation_engine_extracts_mandatory():
    engine = ObligationEngine()
    cko = ComplianceKnowledgeObject(raw_text="Banks shall submit reports monthly.")
    cko = engine.analyze(cko)
    
    # Check if a mandatory obligation was extracted
    mandatory = [ob for ob in cko.obligations if ob.get("category") == "Mandatory"]
    assert len(mandatory) >= 1
    assert "shall" in mandatory[0]["text"].lower()

def test_risk_engine_mandatory_produces_high_severity():
    engine = RiskEngine()
    cko = ComplianceKnowledgeObject()
    cko.obligations = [
        {"id": "1", "category": "Mandatory", "text": "Banks shall submit reports."}
    ]
    cko = engine.analyze(cko)
    
    # Check if RiskEngine produced a High severity risk for the Mandatory obligation
    assert len(cko.risks) == 1
    assert cko.risks[0]["severity"] == "High"
    assert cko.risks[0]["source_obligation_id"] == "1"

def test_conflict_engine_high_density():
    engine = ConflictEngine()
    cko = ComplianceKnowledgeObject()
    # 5 Mandatory obligations out of 10 total to trigger >35% threshold
    cko.obligations = [
        {"id": "1", "category": "Mandatory", "text": "shall do a"} for _ in range(5)
    ] + [
        {"id": "2", "category": "Advisory", "text": "should do b"} for _ in range(5)
    ]
    
    cko = engine.analyze(cko)
    
    # Check if High Density conflict was generated
    density_conflicts = [c for c in cko.conflicts if c["type"] == "High Obligation Density"]
    assert len(density_conflicts) == 1
    assert density_conflicts[0]["severity"] == "High"
    assert density_conflicts[0]["density_ratio"] == 0.50

def test_deadline_engine_relative_deadline():
    engine = DeadlineEngine()
    cko = ComplianceKnowledgeObject(raw_text="The report must be submitted within 30 days.")
    cko = engine.analyze(cko)
    
    # Check if relative deadline was extracted
    deadlines = [d for d in cko.deadlines if "30" in d.get("original_text", "").lower()]
    assert len(deadlines) >= 1
    assert deadlines[0]["days_remaining"] == 30

def test_executive_engine_score_bounds():
    engine = ExecutiveEngine()
    cko = ComplianceKnowledgeObject()
    cko.compliance_score = 85.5
    cko.business_impact = {
        "overall_risk": "Medium",
        "confidence": 90,
        "business_impact": "Moderate impact",
        "recommended_action": "Proceed with caution"
    }
    cko.obligations = [{"category": "Mandatory"}]
    cko.deadlines = [{}]
    cko.risks = [{}]
    cko.conflicts = []
    cko.recommendations = []
    cko.departments = []
    
    cko = engine.analyze(cko)
    
    # Executive engine puts score in dashboard, verify it's between 0 and 100
    assert "executive_dashboard" in cko.__dict__
    score = cko.executive_dashboard.get("compliance_score")
    assert score is not None
    assert 0 <= score <= 100
