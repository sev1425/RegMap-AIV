# ==========================================================
# REGMAP AI ENTERPRISE
# ENTERPRISE KNOWLEDGE GRAPH ENGINE
# ==========================================================
# Enterprise graph requirements (offline):
#   - De-duplicate department nodes by name
#   - Avoid creating unnecessary standalone risk nodes
#   - Each obligation node carries required metadata fields
#   - Provide graph browsing stats for the Digital Twin UI
#
# NOTE: This engine only reshapes the payload stored into cko.knowledge_graph.
# It preserves the existing /api/graph contract (nodes/edges/statistics).

from collections import defaultdict


class KnowledgeGraphEngine:

    def __init__(self):
        pass

    @staticmethod
    def _norm_dept(name: str) -> str:
        return str(name or "").strip().lower()

    def analyze(self, cko):
        nodes = []
        edges = []

        # =====================================================
        # Root Document
        # =====================================================
        nodes.append({
            "id": "DOC",
            "label": getattr(cko, "title", None) or "Compliance Document",
            "type": "document",
            "weight": 10,
            "version": getattr(cko, "version", None),
            "pages": getattr(cko, "pages", None),
        })

        # =====================================================
        # Organizations (optional)
        # =====================================================
        entities = getattr(cko, "entities", {}) or {}
        organizations = entities.get("organizations", []) or []
        for index, organization in enumerate(organizations):
            node_id = f"ORG_{index}"
            nodes.append({
                "id": node_id,
                "label": str(organization),
                "type": "organization",
                "weight": 5,
            })
            edges.append({"source": "DOC", "target": node_id, "relationship": "ISSUED_BY"})

        # =====================================================
        # Departments (dedup by normalized name)
        # =====================================================
        dept_node_map = {}  # normalized_name -> node_id
        departments_payload = getattr(cko, "departments", []) or []
        for department in departments_payload:
            name = department.get("department") or department.get("name") or "Department"
            normalized = self._norm_dept(name)
            if not normalized:
                continue
            if normalized in dept_node_map:
                continue

            node_id = f"DEP_{len(dept_node_map)}"
            dept_node_map[normalized] = node_id

            nodes.append({
                "id": node_id,
                "label": name,
                "type": "department",
                "weight": 6,
                # extra metadata if available
                "owner": department.get("owner") or department.get("responsible") or "",
                "compliance_pct": department.get("compliance_pct") or department.get("compliance"),
                "pending_tasks": department.get("pending_tasks"),
            })
            edges.append({"source": "DOC", "target": node_id, "relationship": "AFFECTS"})

        # =====================================================
        # Evidence nodes (optional, but only created if present)
        # =====================================================
        evidence_payload = getattr(cko, "evidence", []) or []
        evidence_node_map = {}  # (obligation_text, evidence_index) -> node_id
        for index, ev in enumerate(evidence_payload):
            ev_text = ev.get("evidence") or ev.get("text") or ""
            node_id = f"EVD_{index}"
            nodes.append({
                "id": node_id,
                "label": (str(ev_text)[:60] if ev_text else "Evidence"),
                "type": "evidence",
                "weight": 4,
                "confidence": ev.get("confidence") or ev.get("ocr_confidence"),
                "status": ev.get("status"),
                "owner": ev.get("department") or ev.get("owner") or "",
                "obligation": ev.get("obligation"),
            })
            evidence_node_map[index] = node_id

        # =====================================================
        # Deadlines (keep)
        # =====================================================
        deadlines_payload = getattr(cko, "deadlines", []) or []
        deadline_nodes = []
        for index, deadline in enumerate(deadlines_payload):
            node_id = f"DDL_{index}"
            deadline_value = (
                deadline.get("deadline")
                or deadline.get("date_expression")
                or deadline.get("due_date")
                or ""
            )
            nodes.append({
                "id": node_id,
                "label": str(deadline_value)[:60] if deadline_value else "Deadline",
                "type": "deadline",
                "weight": 5,
                "due_date": deadline_value,
                "days_remaining": deadline.get("days_remaining"),
            })
            deadline_nodes.append(node_id)
            edges.append({"source": "DOC", "target": node_id, "relationship": "HAS_DEADLINE"})

        # =====================================================
        # Recommendations (keep)
        # =====================================================
        recommendations_payload = getattr(cko, "recommendations", []) or []
        for index, rec in enumerate(recommendations_payload):
            node_id = f"REC_{index}"
            nodes.append({
                "id": node_id,
                "label": rec.get("title") or rec.get("recommendation") or "Recommendation",
                "type": "recommendation",
                "weight": 3,
                "recommendation": rec.get("recommendation") or rec.get("text") or "",
                "priority": rec.get("priority") or rec.get("impact"),
            })
            edges.append({"source": "DOC", "target": node_id, "relationship": "RECOMMENDS"})

        # =====================================================
        # Build lookups for obligations metadata attachment
        # =====================================================
        risks_payload = getattr(cko, "risks", []) or []
        risk_by_source = defaultdict(list)
        for r in risks_payload:
            src = r.get("source")
            if src:
                risk_by_source[src].append(r)

        evidence_by_obligation_text = defaultdict(list)
        for ev_index, ev in enumerate(evidence_payload):
            ob_text = ev.get("obligation") or ev.get("clause") or ""
            if ob_text:
                evidence_by_obligation_text[ob_text].append(ev_index)

        first_deadline_node = deadline_nodes[0] if deadline_nodes else None
        first_deadline_value = deadlines_payload[0].get("deadline") if deadlines_payload else ""

        # =====================================================
        # Obligations: each obligation node contains required enterprise metadata
        # =====================================================
        for index, obligation in enumerate(getattr(cko, "obligations", []) or []):
            node_id = f"OBL_{index}"

            obligation_text = (
                obligation.get("text")
                or obligation.get("obligation_text")
                or obligation.get("description")
                or ""
            )

            priority = obligation.get("priority") or (
                "High" if str(obligation.get("category") or "").lower() == "mandatory" else "Medium"
            )

            owner = obligation.get("owner") or obligation.get("responsible") or ""
            status = obligation.get("status") or "Pending"
            confidence = obligation.get("confidence")
            source_clause = obligation.get("clause") or obligation.get("source_clause")

            dept_name = (
                obligation.get("department")
                or obligation.get("assigned_department")
                or obligation.get("owner")
                or "General"
            )
            dept_normalized = self._norm_dept(dept_name)
            dept_node_id = dept_node_map.get(dept_normalized)

            matched_risks = risk_by_source.get(obligation_text, [])
            matched_risk = matched_risks[0] if matched_risks else None
            risk_severity = matched_risk.get("severity") if matched_risk else (obligation.get("risk") or "Low")

            matched_evidence_indices = evidence_by_obligation_text.get(obligation_text, [])
            matched_evidence_text = ""
            if matched_evidence_indices:
                first_ev_index = matched_evidence_indices[0]
                ev_obj = evidence_payload[first_ev_index] if first_ev_index < len(evidence_payload) else {}
                matched_evidence_text = ev_obj.get("evidence") or ev_obj.get("text") or ""

            deadline_value = obligation.get("deadline") or first_deadline_value or ""

            nodes.append({
                "id": node_id,
                "label": obligation_text[:60] if obligation_text else f"Obligation {index + 1}",
                "type": "obligation",
                "weight": 4,

                # REQUIRED ENTERPRISE SCHEMA
                "department": dept_name,
                "priority": priority,
                "risk": risk_severity,
                "deadline": deadline_value,
                "evidence": matched_evidence_text,
                "owner": owner,
                "status": status,
                "confidence": confidence,
                "source_clause": source_clause,
            })

            edges.append({"source": "DOC", "target": node_id, "relationship": "CONTAINS"})

            if dept_node_id:
                edges.append({"source": dept_node_id, "target": node_id, "relationship": "RESPONSIBLE_FOR"})

            if first_deadline_node:
                edges.append({"source": node_id, "target": first_deadline_node, "relationship": "DUE_BY"})

            if matched_evidence_indices:
                ev_node_id = evidence_node_map.get(matched_evidence_indices[0])
                if ev_node_id:
                    edges.append({"source": node_id, "target": ev_node_id, "relationship": "REQUIRES_EVIDENCE"})

        # =====================================================
        # Advanced Graph Analytics
        # =====================================================
        degree = defaultdict(int)
        for edge in edges:
            degree[edge["source"]] += 1
            degree[edge["target"]] += 1

        central_node_id = max(degree, key=degree.get) if degree else "DOC"
        central_node_lbl = next((n["label"] for n in nodes if n["id"] == central_node_id), central_node_id)

        adj = defaultdict(set)
        all_node_ids = {n["id"] for n in nodes}
        for edge in edges:
            adj[edge["source"]].add(edge["target"])
            adj[edge["target"]].add(edge["source"])

        visited = set()
        components = 0
        for nid in all_node_ids:
            if nid not in visited:
                components += 1
                stack = [nid]
                while stack:
                    cur = stack.pop()
                    if cur in visited:
                        continue
                    visited.add(cur)
                    stack.extend(adj[cur] - visited)

        # Highest Risk Cluster: based on obligation risk severity distribution
        high_risk_dept = defaultdict(int)
        for n in nodes:
            if n.get("type") == "obligation":
                sev = str(n.get("risk") or "Low")
                if sev.lower() in {"high", "critical"}:
                    high_risk_dept[n.get("department") or "General"] += 1

        highest_risk_cluster = (
            max(high_risk_dept, key=high_risk_dept.get) if high_risk_dept else "None identified"
        )

        dept_ob_count = defaultdict(int)
        for n in nodes:
            if n.get("type") == "obligation":
                dept_ob_count[n.get("department") or "General"] += 1
        most_critical_dept = max(dept_ob_count, key=dept_ob_count.get) if dept_ob_count else "Compliance"

        V = len(nodes)
        E = len(edges)
        density = round(2 * E / (V * (V - 1)), 4) if V > 1 else 0.0

        cko.knowledge_graph = {
            "nodes": nodes,
            "edges": edges,
            "statistics": {
                "nodes": V,
                "edges": E,
                "central_node": central_node_lbl,
                "connected_components": components,
                "highest_risk_cluster": highest_risk_cluster,
                "most_critical_department": most_critical_dept,
                "graph_density": density,
            },
        }

        print(
            f"[AI] Knowledge Graph Engine Completed "
            f"({V} nodes, {E} edges | "
            f"Central: {central_node_lbl} | "
            f"Components: {components} | "
            f"Density: {density})"
        )
        return cko

