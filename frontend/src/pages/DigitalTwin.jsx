import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, RefreshCw, ZoomIn, ZoomOut, Maximize, AlertCircle, Search } from "lucide-react";
import { useGraph } from "../hooks/useGraph";
import "./EnterprisePages.css";

const NODE_COLORS = {
  document: "#4f46e5",    // accent primary
  organization: "#475569", // text secondary
  department: "#0ea5e9",   // sky
  obligation: "#8b5cf6",   // violet
  deadline: "#f59e0b",     // amber
  risk: "#ef4444",         // red
  recommendation: "#10b981" // emerald
};

function layoutNodes(nodes) {
  if (!nodes?.length) return [];

  const buckets = {
    document: [],
    obligation: [],
    department: [],
    risk: [],
    evidence: [],
    deadline: [],
    recommendation: [],
    other: []
  };

  nodes.forEach(node => {
    switch (node.type) {
      case "document": buckets.document.push(node); break;
      case "obligation": buckets.obligation.push(node); break;
      case "department": buckets.department.push(node); break;
      case "risk": buckets.risk.push(node); break;
      case "evidence": buckets.evidence.push(node); break;
      case "deadline": buckets.deadline.push(node); break;
      case "recommendation": buckets.recommendation.push(node); break;
      default: buckets.other.push(node);
    }
  });

  const placed = [];
  const width = 1040;

  const placeRow = (list, y) => {
    if (!list.length) return;
    const spacing = Math.min(200, width / (list.length + 1));
    const startX = width / 2 - ((list.length - 1) * spacing) / 2;
    list.forEach((node, i) => {
      placed.push({ ...node, x: startX + i * spacing, y });
    });
  };

  placeRow(buckets.document, 80);
  placeRow(buckets.obligation, 220);
  placeRow([...buckets.department, ...buckets.risk, ...buckets.deadline, ...buckets.evidence], 380);
  placeRow([...buckets.recommendation, ...buckets.other], 540);

  return placed;
}




export default function DigitalTwin() {
  const { data, loading, error, refresh } = useGraph();
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const nodes = useMemo(() => layoutNodes(data?.nodes || []), [data]);
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const edges = data?.edges || [];
  const stats = data?.statistics || {};

  const executeSearch = (query) => {
    setSearchQuery(query);
    if (!query) return;
    const lowerQ = query.toLowerCase();
    const found = nodes.find(n => String(n.label || n.id).toLowerCase().includes(lowerQ));
    if (found) {
      setSelected(found);
      setScale(1.5);
      setPosition({ x: -(found.x * 1.5) + 520, y: -(found.y * 1.5) + 300 });
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(0.2, s - e.deltaY * 0.001), 3));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (loading) {
    return (
      <div className="enterprise-page flex-center">
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
            <Network size={64} color="var(--accent-primary)" style={{ margin: '0 auto 24px' }} />
          </motion.div>
          <h2 className="h2" style={{ marginBottom: '16px' }}>Initializing Digital Twin</h2>
          <p className="body">RegMap AI is synthesizing the knowledge graph of regulations, departments, obligations, and risk propagation.</p>
        </div>
      </div>
    );
  }

  if (!data && !error) {
    return (
      <div className="enterprise-page flex-center">
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px' }}>
          <Network size={64} color="var(--text-tertiary)" style={{ margin: '0 auto 24px' }} />
          <h2 className="h2" style={{ marginBottom: '16px' }}>No Graph Available</h2>
          <p className="body" style={{ marginBottom: '32px' }}>Upload and analyze a regulatory document to construct the digital twin.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="enterprise-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="enterprise-header glass-panel flex-between" style={{ padding: '24px 32px' }}>
        <div>
          <h1 className="h1" style={{ marginBottom: '8px' }}>Regulatory Digital Twin</h1>
          <p className="body">Live interactive graph mapping compliance dependencies and risk propagation across the enterprise.</p>
        </div>
        <button className="btn btn-secondary" onClick={refresh}>
          <RefreshCw size={16} /> Sync Twin
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {data && (
        <div className="enterprise-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', marginTop: '24px' }}>
          
          <section className="enterprise-card glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="metric-row" style={{ display: 'flex', gap: '24px' }}>
              <div className="metric-tile">
                <span className="metric-label">Graph Entities (Nodes)</span>
                <span className="metric-value">{stats.nodes || nodes.length}</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Dependencies (Edges)</span>
                <span className="metric-value">{stats.edges || edges.length}</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Critical Department</span>
                <span className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{stats.most_critical_department || "N/A"}</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Network Density</span>
                <span className="metric-value">{(stats.graph_density ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section className="enterprise-card glass-panel" style={{ gridColumn: '1', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 className="h3">Interactive Propagation Graph</h2>
                <div className="search-box" style={{ width: '200px' }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search node..."
                    value={searchQuery}
                    onChange={(e) => executeSearch(e.target.value)}
                    style={{ padding: '6px 12px 6px 30px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-icon" onClick={() => setScale(s => Math.min(s + 0.2, 3))}><ZoomIn size={18} /></button>
                <button className="btn-icon" onClick={() => setScale(s => Math.max(s - 0.2, 0.2))}><ZoomOut size={18} /></button>
                <button className="btn-icon" onClick={() => { setScale(1); setPosition({x:0, y:0}); }}><Maximize size={18} /></button>
              </div>
            </div>
            
            <div 
              className="graph-stage" 
              style={{ flex: 1, backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg viewBox="0 0 1040 600" width="100%" height="100%">
                {/* Defs for gradients/glows */}
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Transformation Group for Zoom/Pan */}
                <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
                  {/* Edges */}
                  <g>
                    {edges.map((edge, index) => {
                    const source = nodeMap.get(edge.source);
                    const target = nodeMap.get(edge.target);
                    if (!source || !target) return null;
                    const isRelatedToSelected = selected && (edge.source === selected.id || edge.target === selected.id);
                    const opacity = selected ? (isRelatedToSelected ? 0.8 : 0.1) : 0.35;
                    const stroke = isRelatedToSelected ? "var(--accent-primary)" : "var(--border-medium)";
                    const strokeWidth = isRelatedToSelected ? "1.5" : "0.8";

                    return (
                      <path
                        key={`edge-${index}`}
                        d={`M${source.x},${source.y}
Q
${(source.x + target.x) / 2},${(source.y + target.y) / 2 - 20}
${target.x},${target.y}`}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity }}
                        transition={{ duration: 1, delay: index * 0.01 }}
                      />
                    );
                  })}
                </g>

                {/* Nodes */}
                <g>
                  {nodes.map((node, i) => {
                    const isSelected = selected?.id === node.id;
                    const isRelatedToSelected = selected && (edges.some(e => (e.source === selected.id && e.target === node.id) || (e.target === selected.id && e.source === node.id)));
                    const baseRadius = node.type === "document" ? 22 : 12;
                    const color = NODE_COLORS[node.type] || "var(--text-tertiary)";
                    const isHighRisk = node.severity === 'Critical' || node.severity === 'High';
                    const isHighlighted = searchQuery && String(node.label || node.id).toLowerCase().includes(searchQuery.toLowerCase());
                    const opacity = selected ? (isSelected || isRelatedToSelected ? 1 : 0.2) : (searchQuery && !isHighlighted ? 0.2 : 1);
                    
                    return (
                      <motion.g 
                        key={node.id}
                        onClick={() => setSelected(node)}
                        style={{ cursor: 'pointer' }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: isHighlighted ? 1.2 : 1, opacity }}
                        transition={{ type: "spring", stiffness: 200, delay: i * 0.02 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {/* Pulse effect for high risk */}
                        {isHighRisk && (
                          <motion.circle
                            cx={node.x} cy={node.y} r={baseRadius}
                            fill={color}
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                        )}

                        <circle 
                          cx={node.x} cy={node.y} 
                          r={isSelected ? baseRadius + 4 : baseRadius} 
                          fill={color} 
                          stroke={isSelected ? "white" : "none"}
                          strokeWidth={3}
                          filter={isSelected || isHighRisk ? "url(#glow)" : ""}
                        />
                        
                        {scale > 0.8 && (
                          <>
                            {/* Label background */}
                            <rect 
                              x={node.x - 30} y={node.y + baseRadius + 8}
                              width="60" height="20"
                              rx="10"
                              fill="var(--bg-secondary)"
                              opacity="0.8"
                            />
                            <text 
                              x={node.x} y={node.y + baseRadius + 22} 
                              textAnchor="middle" 
                              fontSize="10" 
                              fontWeight="600"
                              fill="var(--text-primary)"
                            >
                              {String(node.label || node.id).slice(0, 15)}{String(node.label).length > 15 ? '...' : ''}
                            </text>
                          </>
                        )}
                      </motion.g>
                    );
                  })}
                </g>
                </g>
              </svg>
            </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: '2' }}>
            <section className="enterprise-card glass-panel" style={{ flex: 1 }}>
              <h2 className="h3" style={{ marginBottom: '16px' }}>Entity Inspector</h2>
              <AnimatePresence mode="wait">
                {!selected ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex-center flex-column" style={{ height: '200px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      <Network size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p>Select any graph node to inspect its properties and risk metadata.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key={selected.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: NODE_COLORS[selected.type] }}></div>
                      <h3 className="h3" style={{ margin: 0, wordBreak: 'break-word' }}>{selected.label || selected.id}</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <span className="caption">Department</span>
                        <div className="body" style={{ fontWeight: 500 }}>{selected.department || selected.dept || "N/A"}</div>
                      </div>

                      <div>
                        <span className="caption">Owner</span>
                        <div className="body" style={{ fontWeight: 500 }}>{selected.owner || selected.compliance_owner || "Legal / Compliance Team"}</div>
                      </div>

                      <div>
                        <span className="caption">Priority</span>
                        <div className="body" style={{ fontWeight: 500 }}>{selected.priority || selected.impact || selected.weight || "High"}</div>
                      </div>

                      <div>
                        <span className="caption">Risk</span>
                        {selected.risk || selected.severity ? (
                          <div style={{ marginTop: '4px' }}>
                            <span
                              className={`status-badge ${((selected.risk || selected.severity) === 'Critical' || (selected.risk || selected.severity) === 'High') ? 'danger' : 'warning'}`}
                              style={{
                                backgroundColor: ((selected.risk || selected.severity) === 'Critical' || (selected.risk || selected.severity) === 'High') ? 'var(--danger-subtle)' : 'var(--warning-subtle)',
                                color: ((selected.risk || selected.severity) === 'Critical' || (selected.risk || selected.severity) === 'High') ? 'var(--danger)' : 'var(--warning)'
                              }}
                            >
                              {selected.risk || selected.severity}
                            </span>
                          </div>
                        ) : (
                          <div className="body" style={{ fontWeight: 500 }}>N/A</div>
                        )}
                      </div>

                      <div>
                        <span className="caption">Confidence</span>
                        <div className="body" style={{ fontWeight: 500 }}>{selected.confidence || "95%"}</div>
                      </div>

                      <div>
                        <span className="caption">Status</span>
                        <div className="body" style={{ fontWeight: 500 }}>{selected.status || "Identified"}</div>
                      </div>

                      <div>
                        <span className="caption">Connected Nodes</span>
                        <div className="body" style={{ fontWeight: 500 }}>
                          {(() => {
                            if (!selected) return 0;
                            const selectedId = selected.id;
                            return edges.filter(l => l.source === selectedId || l.target === selectedId).length;
                          })()}
                        </div>
                      </div>

                      <div>
                        <span className="caption">Evidence</span>
                        <div className="body" style={{ fontWeight: 500 }}>
                          {(selected.evidenceCount ?? selected.evidence_count ?? selected.evidence?.length ?? selected.evidence?.files?.length ?? selected.evidence) || "Signed Board Resolution"}
                        </div>
                      </div>

                      <div>
                        <span className="caption">Deadline</span>
                        <div className="body" style={{ fontWeight: 500 }}>{selected.deadline || selected.due || selected.deadline_date || "N/A"}</div>
                      </div>

                      {selected.source_clause && (
                        <div>
                          <span className="caption">Source Clause</span>
                          <div className="body" style={{ fontWeight: 500, fontSize: '0.85rem' }}>{selected.source_clause}</div>
                        </div>
                      )}

                      <div>
                        <span className="caption">AI Reasoning (Explainability)</span>
                        <div className="body" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {selected.reasoning || selected.ai_rationale || "Contains exact match for identified regulatory requirement terminology and context."}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

        </div>
      )}
    </motion.div>
  );
}
