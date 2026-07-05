import json
import os
from datetime import datetime
from .pdf_generator import EnterprisePDFGenerator

class ReportExportService:
    """
    Report Export Service
    Handles exporting the Enterprise Report (from the Compliance Knowledge Object) 
    into various enterprise formats such as JSON and PDF.
    """
    
    def __init__(self, export_dir="uploads/exports"):
        self.export_dir = export_dir
        self.pdf_generator = EnterprisePDFGenerator(output_dir=export_dir)
        
        # Ensure export directory exists
        os.makedirs(self.export_dir, exist_ok=True)

    def export_json(self, report_data: dict, filename_prefix: str = "RegMap_Report") -> str:
        """
        Exports the enterprise report to a formatted JSON file.
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.json"
        filepath = os.path.join(self.export_dir, filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=4)
            
        return filepath

    def export_pdf(self, report_data: dict, filename_prefix: str = "RegMap_Report") -> str:
        """
        Delegates PDF generation to the specialized enterprise generator.
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.pdf"
        
        return self.pdf_generator.generate(report_data, filename)
