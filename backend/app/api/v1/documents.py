from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from uuid import UUID
from app.models.base import Document, User
from app.core.auth import get_current_user
from app.services.document import document_service
from pydantic import BaseModel

router = APIRouter(prefix="/documents", tags=["documents"])

class DocumentAnalysisRequest(BaseModel):
    query: str

class DocumentComparisonRequest(BaseModel):
    doc1_id: UUID
    doc2_id: UUID
    comparison_type: Optional[str] = "general"

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Document:
    """Upload and process a new document."""
    try:
        content = await file.read()
        document = Document(
            title=file.filename,
            content=content.decode(),
            type="document",
            user_id=current_user.id
        )
        
        # Process document and store embeddings
        vector_id = await document_service.process_document(document)
        document.vector_id = vector_id
        
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{document_id}/analyze")
async def analyze_document(
    document_id: UUID,
    request: DocumentAnalysisRequest,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Analyze a document with a specific query."""
    try:
        result = await document_service.analyze_document(
            str(document_id),
            request.query
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare")
async def compare_documents(
    request: DocumentComparisonRequest,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Compare two documents."""
    try:
        result = await document_service.compare_documents(
            str(request.doc1_id),
            str(request.doc2_id),
            request.comparison_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{document_id}/summarize")
async def summarize_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Generate a summary of the document."""
    try:
        result = await document_service.summarize_document(str(document_id))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 