# RegMap AI Enterprise 🏦⚖️

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Build Status](https://github.com/sev1425/RegMap-AIV/actions/workflows/backend-ci.yml/badge.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Theme](https://img.shields.io/badge/theme-Agentic%20Regulatory%20Intelligence-6366f1.svg)

> **"Compliance failures in Indian banking are preventable."**  
> RegMap AI converts any RBI, SEBI, MCA or IBA circular into structured, trackable compliance actions — automatically.

---

## 🏆 Hackathon Submission — SuRaksha Cyber Hackathon 2.0
**Theme: Agentic Regulatory Intelligence & Compliance**

RegMap AI directly addresses every requirement of the theme:

| Theme Requirement | RegMap AI Solution |
|---|---|
| Monitor regulatory changes | Universal Document Loader (PDF, DOCX, images, text paste) |
| Translate to Measurable Action Points | **MAPEngine** — per-obligation department routing + deadline + evidence |
| Assign to correct bank departments | Per-obligation routing across 8 departments (IT/CISO, Legal, Risk, HR, etc.) |
| Autonomously validate completion | Evidence Validator + Audit Intelligence with tamper-evident chain |

---

## 📖 The Problem

A compliance analyst at a mid-sized Indian bank spends **40–60 hours manually** reviewing a single regulatory circular.

With RBI issuing **100+ circulars per year**, the current workflow is:

```
New Circular → Manual Reading (40-60h) → Excel Tracker → Email Chains
→ Missed Deadlines → Regulatory Penalty (₹1Cr – ₹250Cr)
```

Existing tools (Kira, Luminance) send documents to cloud servers — a **data-residency violation** under DPDP Act 2023. They also produce nondeterministic output that cannot be used as audit evidence.

---

## ✅ What RegMap AI Does

Upload any regulatory PDF — or **paste circular text directly** — and receive a complete compliance intelligence report in under 4 seconds, entirely offline.

### Core Output: Measurable Action Points (MAPs)

Each MAP contains:

```
MAP-001 | Priority: Critical | Department: IT / CISO
Obligation: Banks shall maintain ISO 27001-aligned Information Security Policy
Deadline:   30 days (28 Jul 2026)
Evidence:   Board-approved policy document, ISO certification
Penalty:    ₹1–5 Cr + RBI Regulatory Action (RBI CSF 2016)
Status:     Pending → [In Progress] → [Complete]
```

### Full Feature Set

| Feature | Description |
|---|---|
| **Obligation Extraction** | NLP (spaCy + sentence-transformers) extracts every 'shall', 'must', 'required' clause |
| **MAP Generator** | Converts obligations to MAPs with department, deadline, evidence, penalty |
| **Per-Obligation Department Routing** | Each MAP routed to IT/CISO, Legal, Compliance, Risk, HR, Operations, Finance, or Treasury |
| **Risk Engine** | Severity classification with actual penalty exposure (₹50L – ₹250Cr) |
| **Deadline Tracker** | Parses temporal expressions; maps to compliance calendar |
| **Conflict Detector** | Cross-circular contradiction detection |
| **Evidence Validator** | Upload evidence per MAP; validates against requirement |
| **Digital Twin** | Knowledge graph: Regulation → Obligation → Department → Risk |
| **AI Copilot** | Natural language Q&A over the analyzed document (fully offline) |
| **Audit Intelligence** | Tamper-evident audit chain; DPDP Act 2023 + ISO 27001 compliant |
| **Executive PDF Report** | Board-ready compliance report with compliance score |
| **ROI Calculator** | Quantifies time and cost savings vs manual process |

---

## 🏗️ Architecture — 17-Stage CKO Pipeline

RegMap uses a **Compliance Knowledge Object (CKO)** — a single structured data object that every agent reads and enriches:

```
Regulatory Circular (PDF / DOCX / Text)
        ↓
Universal Document Loader (OCR + text extraction)
        ↓
Entity Engine      → Extracts issuer, dates, references
        ↓
Obligation Engine  → NLP: spaCy + sentence-transformers
        ↓
Deadline Engine    → Temporal expression parsing
        ↓
Department Engine  → Per-obligation routing (8 departments)
        ↓
Decision Engine    → Priority scoring
        ↓
Risk Engine        → Severity + penalty exposure estimation
        ↓
MAP Engine ⭐      → Measurable Action Points generation
        ↓
Evidence Engine    → Evidence requirement mapping
        ↓
Conflict Engine    → Cross-circular contradiction check
        ↓
Recommendation Engine → Actionable guidance
        ↓
Knowledge Graph    → 47 nodes, 89 edges
        ↓
Compliance Reasoning → Rule-based compliance logic
        ↓
Executive Engine   → Board-level summary
        ↓
Explainability Engine → Full audit trail (DPDP compliant)
        ↓
Timeline + Analytics + Report Engines
        ↓
Compliance Knowledge Object (Complete)
        ↓
React Dashboard + AI Copilot + PDF Export
```

---

## 📊 Benchmark

Tested on a live RBI circular (148 pages):

| Metric | Result |
|---|---|
| Obligations extracted | 83 |
| MAPs generated | 83 |
| Processing time | < 4 seconds |
| False positives | < 5% |
| Offline (no cloud) | ✅ |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.9+, Flask, SQLite |
| AI Pipeline | spaCy (en_core_web_sm), sentence-transformers (all-MiniLM-L6-v2) |
| Document Parsing | pdfplumber, PyMuPDF, pytesseract, python-docx |
| Frontend | React 18, Vite, Framer Motion, Recharts, Lucide Icons |
| PDF Export | ReportLab, fpdf2 |
| Infrastructure | Docker, Docker Compose, GitHub Actions |
| Compliance | DPDP Act 2023 ✓ | ISO 27001 ✓ | PCI-DSS ✓ |

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Docker (Recommended)

```bash
# 1. Clone
git clone https://github.com/sev1425/RegMap-AIV.git
cd RegMap-AIV

# 2. Environment
cp .env.example .env

# 3. Download AI models (one-time, requires internet)
cd backend && python setup_models.py && cd ..

# 4. Start
docker-compose up --build -d

# 5. Open
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# API Docs: http://localhost:5000/docs
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python setup_models.py          # Downloads spaCy + sentence-transformers models
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Option 3: Text Paste (No File Needed)

```bash
curl -X POST http://localhost:5000/api/upload/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Banks shall maintain a Board-approved cyber security policy within 30 days..."}'
```

Response includes full MAPs, risks, departments, and compliance score.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/upload/` | POST | Upload PDF/DOCX/image for analysis |
| `/api/upload/text` | POST | Paste circular text directly |
| `/api/maps/` | GET | Get all Measurable Action Points |
| `/api/maps/{id}/status` | PATCH | Update MAP completion status |
| `/api/maps/department/{dept}` | GET | Filter MAPs by department |
| `/api/dashboard/` | GET | Full compliance dashboard |
| `/api/copilot/` | POST | Ask AI Copilot a question |
| `/api/analytics/` | GET | Charts and KPI data |
| `/api/reports/` | GET | Download executive PDF |
| `/api/audit/` | GET | Full audit trail |
| `/api/conflict/` | GET | Conflict detection results |
| `/api/evidence/` | POST | Upload and validate evidence |

---

## 🔐 Compliance & Privacy

- **100% Offline at Inference** — No regulatory data ever leaves your machine
- **Deterministic Pipeline** — Identical inputs produce identical outputs (auditable)
- **Tamper-Evident Audit Chain** — Every AI decision logged with input, output, confidence
- **DPDP Act 2023** — No personal data processed or transmitted
- **ISO 27001 Annex A.12.4** — Full audit logging
- **PCI-DSS v4.0** — Secure data handling

---

## 📞 Contact

**Team:** RegMap AI  
**GitHub:** [github.com/sev1425/RegMap-AIV](https://github.com/sev1425/RegMap-AIV)  
**Email:** contact@regmap.ai
