from database.database import RegMapDatabase

from models.compliance import ComplianceKnowledgeObject

db = RegMapDatabase()

cko = ComplianceKnowledgeObject()

cko.title = "RBI Circular"

cko.compliance_score = 91.5

cko.business_impact = {

    "overall_risk":"High",

    "confidence":94

}

cko.executive_dashboard = {

    "summary":"Database Test"

}

db.save_analysis(cko)

print()

print(db.get_all_analyses())