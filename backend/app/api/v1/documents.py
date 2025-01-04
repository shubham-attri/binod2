from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.security import get_current_user
from app.models.document import Document
from app.services.document import DocumentService
from typing import List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
document_service = DocumentService()

@router.get("/list", response_model=List[Document])
async def list_documents(current_user: dict = Depends(get_current_user)):
    """List all documents for the current user"""
    try:
        documents = await document_service.list_documents(current_user["sub"])
        return documents
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=Document)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a new document"""
    try:
        document = await document_service.save_file(file, current_user["sub"])
        return document
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{document_id}", response_model=Document)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get document details"""
    # TODO: Implement document retrieval
    raise HTTPException(status_code=501, detail="Not implemented") 