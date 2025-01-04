from typing import List
from langchain_core.tools import tool
from app.services.case import CaseService
from app.services.document import DocumentService

@tool
def search_cases(query: str) -> str:
    """Search through case database."""
    # Placeholder for now
    return f"Found relevant cases for: {query}"

@tool
def search_documents(query: str) -> str:
    """Search through legal documents."""
    # Placeholder for now
    return f"Found relevant documents for: {query}"

@tool
def analyze_document(doc_id: str) -> str:
    """Analyze a specific document."""
    # Placeholder for now
    return f"Analysis of document {doc_id}"

tools = [search_cases, search_documents, analyze_document] 