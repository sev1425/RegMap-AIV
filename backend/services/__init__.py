from .analysis_service import AnalysisService

# Initialize global services for use across APIs
analysis_service = AnalysisService()

__all__ = ["AnalysisService", "analysis_service"]
