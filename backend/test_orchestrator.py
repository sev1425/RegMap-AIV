import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ai.orchestrator import RegMapAIEngine
from ai.copilot_engine import OfflineAICopilotEngine
from ai.search_engine import EnterpriseSearchEngine
from ai.comparison_engine import RegulationComparisonEngine

brain = RegMapAIEngine()

text = """
Reserve Bank of India requires the Treasury
department to submit compliance reports.

Banks shall maintain records.

Every bank must report suspicious transactions
before 15 July 2026.

The Compliance department must submit
quarterly regulatory reports.

The Risk department shall monitor
operational risk continuously.

The IT team shall maintain secure systems.
"""

print("[*] Running main pipeline...")
result = brain.analyze(text)

# ==========================================================
# ENGINE PERFORMANCE
# ==========================================================
print()
print("=" * 70)
print("ENGINE PERFORMANCE")
print("=" * 70)

for entry in result.engine_history:
    if isinstance(entry, dict):
        print(f"\n  {entry['engine']}")
        print(f"    Time:            {entry.get('execution_time_ms', 0)} ms")
        print(f"    Memory:          {entry.get('memory_delta_mb', 0)} MB delta  ({entry.get('memory_usage_mb', 0)} MB total)")
        print(f"    Records Created: {entry.get('records_created', 0)}")
        print(f"    CKO Size:        {entry.get('cko_size_kb', 0)} KB")
    else:
        print(f"  {entry}")

# ==========================================================
# KNOWLEDGE GRAPH INSIGHTS
# ==========================================================
print()
print("=" * 70)
print("KNOWLEDGE GRAPH INSIGHTS")
print("=" * 70)

stats = result.knowledge_graph.get("statistics", {})
print(f"\n  Total Nodes:             {stats.get('nodes')}")
print(f"  Total Edges:             {stats.get('edges')}")
print(f"\n  Central Node:            {stats.get('central_node')}")
print(f"  Most Critical Department:{stats.get('most_critical_department')}")
print(f"  Connected Components:    {stats.get('connected_components')}")
print(f"  Highest Risk Cluster:    {stats.get('highest_risk_cluster')}")
print(f"  Graph Density:           {stats.get('graph_density')}")

# ==========================================================
# ENTERPRISE ANALYTICS
# ==========================================================
print()
print("=" * 70)
print("ENTERPRISE ANALYTICS")
print("=" * 70)

analytics = result.executive_dashboard.get("analytics", {})

kpi = analytics.get("compliance_kpi", {})
print(f"\n  Compliance KPI:")
print(f"    Score:       {kpi.get('compliance_score')}%")
print(f"    Total Risks: {kpi.get('total_risks')}")
print(f"    High Risks:  {kpi.get('high_risks')}")
print(f"    Obligations: {kpi.get('total_obligations')} ({kpi.get('mandatory_obligations')} mandatory)")
print(f"    Overall Risk:{kpi.get('overall_risk')}")

print(f"\n  Department Risk:")
dept_risk = analytics.get("department_risk", {})
for dept, severity_map in dept_risk.items():
    print(f"    {dept}: High={severity_map.get('High',0)} Medium={severity_map.get('Medium',0)} Low={severity_map.get('Low',0)}")

print(f"\n  Priority Breakdown:")
pb = analytics.get("priority_breakdown", {})
for k, v in pb.items():
    print(f"    {k}: {v}")

tp = analytics.get("timeline_progress", {})
print(f"\n  Timeline Progress:")
print(f"    Total Tasks:  {tp.get('total_tasks')}")
print(f"    Completed:    {tp.get('completed')}")
print(f"    Completion %: {tp.get('completion_percentage')}%")

rs = analytics.get("readiness_score", 0)
print(f"\n  Readiness Score:         {rs}%")

print(f"\n  Risk Trend:")
for pt in analytics.get("risk_trend", []):
    print(f"    {pt['stage']}: {pt['score']}")

# ==========================================================
# IMPLEMENTATION ROADMAP (Timeline)
# ==========================================================
print()
print("=" * 70)
print("IMPLEMENTATION ROADMAP")
print("=" * 70)

# Print unique phases in order of first appearance
seen_phases = []
for act in result.implementation_timeline:
    phase = act.get("phase")
    if phase not in seen_phases:
        seen_phases.append(phase)

print()
for idx, phase in enumerate(seen_phases):
    print(f"  {phase}")
    if idx < len(seen_phases) - 1:
        print(f"    |")

print()
print(f"  Total Activities: {len(result.implementation_timeline)}")
print()
sample = result.implementation_timeline[:3] if result.implementation_timeline else []
for act in sample:
    print(f"  [{act['id']}] {act['title']}")
    print(f"       Owner: {act['owner']}  |  End: {act['end_date']}  |  Priority: {act['priority']}")

# ==========================================================
# ENTERPRISE REPORT
# ==========================================================
print()
print("=" * 70)
print("ENTERPRISE REPORT")
print("=" * 70)

report = result.enterprise_report
print(f"  Sections: {list(report.keys())}")
print(f"  JSON Export: {report.get('exports', {}).get('json', 'MISSING')}")
print(f"  PDF Export:  {report.get('exports', {}).get('pdf', 'MISSING')}")

# ==========================================================
# OFFLINE AI COPILOT ENGINE
# ==========================================================
print()
print("=" * 70)
print("OFFLINE AI COPILOT ENGINE")
print("=" * 70)

copilot = OfflineAICopilotEngine()
q1  = "What is the compliance score?"
ans1 = copilot.query(result, q1)
print(f"  Q: {q1}")
print(f"  A: {ans1['response']}")
if "confidence" in ans1:
    print(f"  Confidence: {ans1['confidence']}%")

q2  = "Show high risks"
ans2 = copilot.query(result, q2)
print(f"\n  Q: {q2}")
print(f"  A: {ans2['response']}")

# ==========================================================
# ENTERPRISE SEARCH ENGINE
# ==========================================================
print()
print("=" * 70)
print("ENTERPRISE SEARCH ENGINE")
print("=" * 70)

searcher = EnterpriseSearchEngine()
s_query  = "report"
print(f"  Searching for '{s_query}'...")
s_res    = searcher.search(result, s_query)
print(f"  Found {s_res['total_results']} matches.")
for match in s_res["results"][:3]:
    print(f"   -> [{match['category']}] Relevance: {match['relevance_score']}")

# ==========================================================
# REGULATION COMPARISON ENGINE
# ==========================================================
print()
print("=" * 70)
print("REGULATION COMPARISON ENGINE")
print("=" * 70)

print("  [*] Creating secondary CKO for comparison...")
result2   = brain.analyze("Reserve Bank of India requires the Treasury to submit monthly compliance reports.")
comparator = RegulationComparisonEngine()
comp_res  = comparator.compare(result, result2)

print(f"  {comp_res['summary']}")
print(f"  Added Obligations:   {len(comp_res['added_obligations'])}")
print(f"  Removed Obligations: {len(comp_res['removed_obligations'])}")

print()
print("=" * 70)
print("TEST EXECUTION COMPLETED SUCCESSFULLY")
print("=" * 70)