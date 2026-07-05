import os
from datetime import datetime

def _safe(text: str) -> str:
    """Sanitize text for fpdf core fonts (Latin-1 only).

    The project previously failed on Unicode punctuation like U+2019 (RIGHT SINGLE QUOTATION MARK, ’).
    fpdf's core Helvetica doesn't support these characters, so we normalize them to ASCII / Latin-1.
    """
    if text is None:
        return ""

    s = str(text)

    # Common Unicode punctuation → ASCII/L1-ish equivalents
    replacements = {
        # quotes
        "\u2018": "'",  # ‘
        "\u2019": "'",  # ’
        "\u201a": "'",  # ‚
        "\u201b": "'",  # ‛
        "\u2032": "'",  # ′
        "\u2035": "'",  # ‵
        "\u201c": '"',  # “
        "\u201d": '"',  # ”
        "\u201e": '"',  # „
        "\u201f": '"',  # ‟
        "\u2033": '"',  # ″
        "\u2036": '"',  # ‶

        # dashes
        "\u2013": "-",  # –
        "\u2014": "-",  # —
        "\u2212": "-",  # minus sign

        # ellipsis
        "\u2026": "...",  # …

        # whitespace
        "\u00a0": " ",  # nbsp
    }

    for k, v in replacements.items():
        s = s.replace(k, v)

    # Finally drop anything still not representable in Latin-1
    return s.encode("latin-1", errors="ignore").decode("latin-1")



class EnterprisePDFGenerator:
    """
    Enterprise PDF Generator
    Generates a professional, judge-ready PDF report using fpdf.
    Includes: Cover page, Executive Summary, Risk Register table,
    Board Summary, Audit Summary, footer with page numbers.
    """

    def __init__(self, output_dir="uploads/exports"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate(self, report_data: dict, filename: str) -> str:
        filepath = os.path.join(self.output_dir, filename)

        try:
            from fpdf import FPDF

            class _PDF(FPDF):
                def header(self):
                    if self.page_no() == 1:
                        return
                    self.set_font("Arial", "B", 9)
                    self.set_text_color(120, 120, 120)
                    self.cell(0, 8, "RegMap AI Enterprise - Confidential Compliance Report", 0, 0, "R")
                    self.ln(6)

                def footer(self):
                    self.set_y(-14)
                    self.set_font("Arial", "I", 8)
                    self.set_text_color(150, 150, 150)
                    self.cell(0, 6, f"Page {self.page_no()}", 0, 0, "C")

            pdf = _PDF()
            pdf.set_auto_page_break(auto=True, margin=18)

            # ──────────────────────────────────────────────
            # PAGE 1 — COVER
            # ──────────────────────────────────────────────
            pdf.add_page()
            pdf.set_fill_color(15, 30, 60)
            pdf.rect(0, 0, 210, 297, "F")

            pdf.ln(60)
            pdf.set_font("Arial", "B", 28)
            pdf.set_text_color(255, 255, 255)
            pdf.cell(0, 14, "REGMAP AI ENTERPRISE", ln=1, align="C")

            pdf.set_font("Arial", "", 14)
            pdf.set_text_color(180, 200, 240)
            pdf.cell(0, 10, "Regulatory Compliance & Risk Assessment Report", ln=1, align="C")

            pdf.ln(20)
            pdf.set_font("Arial", "B", 11)
            pdf.set_text_color(255, 200, 80)
            doc_title = _safe(report_data.get("document", {}).get("title", "Compliance Document"))
            pdf.cell(0, 10, f"Document: {doc_title}", ln=1, align="C")

            pdf.ln(8)
            pdf.set_font("Arial", "", 10)
            pdf.set_text_color(180, 200, 240)
            generated_on = report_data.get("report_information", {}).get("generated_on", datetime.utcnow().strftime("%d-%m-%Y %H:%M:%S"))
            pdf.cell(0, 8, f"Generated: {generated_on} UTC", ln=1, align="C")
            pdf.cell(0, 8, "Classification: CONFIDENTIAL", ln=1, align="C")

            # ──────────────────────────────────────────────
            # PAGE 2 — EXECUTIVE SUMMARY + KPIs
            # ──────────────────────────────────────────────
            pdf.add_page()
            self._section_title(pdf, "1. Executive Summary")
            pdf.set_font("Arial", "", 11)
            pdf.set_text_color(30, 30, 30)
            narrative = _safe(report_data.get("executive_summary", "No summary available."))
            pdf.multi_cell(0, 7, narrative)
            pdf.ln(8)

            # KPI boxes
            kpis = report_data.get("compliance_kpis", {})
            self._section_title(pdf, "Compliance KPIs")
            kpi_pairs = [
                ("Compliance Score", f"{kpis.get('compliance_score', 'N/A')} / 100"),
                ("Risk Score",       f"{kpis.get('risk_score', 'N/A')}"),
                ("Total Obligations",f"{kpis.get('total_obligations', 0)}"),
                ("Total Risks",      f"{kpis.get('total_risks', 0)}"),
                ("High Risks",       f"{kpis.get('high_risks', 0)}"),
                ("Readiness",        f"{kpis.get('readiness_rating', 'N/A')}"),
            ]
            pdf.set_font("Arial", "B", 10)
            pdf.set_fill_color(230, 240, 255)
            pdf.set_text_color(20, 40, 80)
            for label, value in kpi_pairs:
                pdf.cell(90, 9, f"  {label}", border=1, fill=True)
                pdf.cell(100, 9, f"  {value}", border=1, fill=False, ln=1)

            # ──────────────────────────────────────────────
            # PAGE 3 — RISK REGISTER TABLE
            # ──────────────────────────────────────────────
            pdf.add_page()
            self._section_title(pdf, "2. Risk Register")

            risks = report_data.get("risks", [])
            if not risks:
                pdf.set_font("Arial", "", 11)
                pdf.cell(0, 8, "No risks identified.", ln=1)
            else:
                # Header row
                pdf.set_font("Arial", "B", 10)
                pdf.set_fill_color(20, 40, 80)
                pdf.set_text_color(255, 255, 255)
                pdf.cell(22, 9, "Risk ID",    border=1, fill=True)
                pdf.cell(28, 9, "Severity",   border=1, fill=True)
                pdf.cell(22, 9, "Status",     border=1, fill=True)
                pdf.cell(118, 9, "Description", border=1, fill=True, ln=1)

                pdf.set_font("Arial", "", 9)
                pdf.set_text_color(20, 20, 20)
                for i, r in enumerate(risks):
                    fill = (i % 2 == 0)
                    pdf.set_fill_color(240, 245, 255) if fill else pdf.set_fill_color(255, 255, 255)
                    sev = str(r.get("severity", "Medium"))
                    if sev == "High":
                        pdf.set_text_color(180, 0, 0)
                    elif sev == "Low":
                        pdf.set_text_color(0, 130, 0)
                    else:
                        pdf.set_text_color(180, 100, 0)

                    r_id   = _safe(r.get("id", f"RSK-{i+1:03d}"))
                    r_stat = _safe(r.get("status", "Open"))
                    r_desc = _safe(r.get("description", r.get("source", "")))
                    r_desc = (r_desc[:72] + "...") if len(r_desc) > 72 else r_desc

                    pdf.cell(22, 8, r_id,    border=1, fill=fill)
                    pdf.cell(28, 8, sev,     border=1, fill=fill)
                    pdf.cell(22, 8, r_stat,  border=1, fill=fill)
                    pdf.set_text_color(20, 20, 20)
                    pdf.cell(118, 8, r_desc, border=1, fill=fill, ln=1)

            # ──────────────────────────────────────────────
            # PAGE 4 — BOARD SUMMARY + AUDIT SUMMARY
            # ──────────────────────────────────────────────
            pdf.add_page()
            self._section_title(pdf, "3. Board Summary")
            pdf.set_font("Arial", "", 11)
            pdf.set_text_color(30, 30, 30)
            pdf.multi_cell(0, 7, _safe(report_data.get("board_summary", "No board summary.")))

            pdf.ln(10)
            self._section_title(pdf, "4. Audit Summary")
            pdf.multi_cell(0, 7, _safe(report_data.get("audit_summary", "No audit summary.")))

            pdf.ln(10)
            self._section_title(pdf, "5. Executive Notes")
            pdf.multi_cell(0, 7, _safe(report_data.get("executive_notes", "None.")))

            # ──────────────────────────────────────────────
            # PAGE 5 — DEPARTMENT SUMMARY & EVIDENCE
            # ──────────────────────────────────────────────
            pdf.add_page()
            self._section_title(pdf, "6. Department Summary")
            depts = report_data.get("departments", [])
            if not depts:
                pdf.cell(0, 8, "No department breakdown available.", ln=1)
            else:
                for d in depts:
                    dname = _safe(d.get("name", d.get("department", "Unknown")))
                    pdf.set_font("Arial", "B", 10)
                    pdf.set_text_color(20, 40, 80)
                    pdf.cell(0, 6, dname, ln=1)
                    
                    pdf.set_font("Arial", "", 9)
                    pdf.set_text_color(40, 40, 40)
                    d_desc = _safe(d.get("impact", d.get("responsibilities", "")))
                    if d_desc:
                        pdf.multi_cell(0, 5, d_desc)
                    pdf.ln(4)
            
            pdf.ln(6)
            self._section_title(pdf, "7. Evidence Requirements")
            evidence = report_data.get("evidence", [])
            if not evidence:
                pdf.cell(0, 8, "No evidence requirements logged.", ln=1)
            else:
                for e in evidence:
                    ename = _safe(e.get("name", e.get("title", "Unknown Evidence")))
                    estat = _safe(e.get("status", "Missing"))
                    pdf.set_font("Arial", "B", 9)
                    pdf.set_text_color(20, 20, 20)
                    pdf.cell(140, 6, f"- {ename}")
                    
                    if estat.lower() == "available":
                        pdf.set_text_color(0, 130, 0)
                    else:
                        pdf.set_text_color(180, 0, 0)
                    pdf.cell(50, 6, f"[{estat}]", ln=1, align="R")
                    pdf.set_text_color(20, 20, 20)

            # ──────────────────────────────────────────────
            # PAGE 6 — TIMELINE & RECOMMENDATIONS
            # ──────────────────────────────────────────────
            pdf.add_page()
            self._section_title(pdf, "8. Upcoming Deadlines")
            deadlines = report_data.get("deadlines", report_data.get("implementation_timeline", []))
            if not deadlines:
                pdf.cell(0, 8, "No deadlines specified.", ln=1)
            else:
                for dl in deadlines:
                    date_val = _safe(dl.get("date", dl.get("deadline", "Unknown Date")))
                    task = _safe(dl.get("task", dl.get("event", "Unknown Task")))
                    pdf.set_font("Arial", "B", 9)
                    pdf.cell(40, 6, date_val)
                    pdf.set_font("Arial", "", 9)
                    pdf.cell(150, 6, (task[:90] + "...") if len(task) > 90 else task, ln=1)
            
            pdf.ln(10)
            self._section_title(pdf, "9. AI Recommendations")
            recs = report_data.get("recommendations", [])
            if not recs:
                pdf.cell(0, 8, "No recommendations generated.", ln=1)
            else:
                for idx, rec in enumerate(recs):
                    pdf.set_font("Arial", "B", 9)
                    pri = _safe(rec.get("priority", "Medium")).upper()
                    pdf.set_text_color(180, 0, 0) if pri == "HIGH" else pdf.set_text_color(20, 40, 80)
                    pdf.cell(30, 6, f"PRIORITY: {pri}")
                    
                    pdf.set_font("Arial", "", 9)
                    pdf.set_text_color(20, 20, 20)
                    desc = _safe(rec.get("description", rec.get("action", "")))
                    pdf.multi_cell(0, 6, f"{idx+1}. {desc}")
                    pdf.ln(2)

            pdf.output(filepath)
            print(f"[REPORTS] Enterprise PDF generated: {filepath}")

        except ImportError:
            # Fallback: write a text-based stub that declares itself a PDF
            with open(filepath, "w", encoding="utf-8") as f:
                f.write("%PDF-1.4\n")
                f.write(f"%% Enterprise Regulatory Compliance Report\n")
                f.write(f"%% Generated for: {report_data.get('document', {}).get('title', 'Unknown')}\n")
                f.write(f"%% Generated on:  {datetime.utcnow()}\n")
            print(f"[REPORTS] PDF stub generated (fpdf not installed): {filepath}")

        return filepath

    # ──────────────────────────────────────────────────────
    # Helper: render a section title
    # ──────────────────────────────────────────────────────
    def _section_title(self, pdf, text: str):
        pdf.set_font("Arial", "B", 13)
        pdf.set_text_color(15, 30, 80)
        pdf.cell(0, 10, text, ln=1)
        pdf.set_draw_color(15, 30, 80)
        pdf.set_line_width(0.5)
        pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
        pdf.ln(4)
