from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from typing import Optional, List
from app.core.security import get_current_user
from app.models.auth import User
from app.models.document import Document
from app.services.storage import StorageService
import mimetypes

router = APIRouter()
storage_service = StorageService()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    chat_session_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Upload a document"""
    try:
        file_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        
        document = storage_service.upload_document(
            file=file.file,
            filename=file.filename,
            user_id=current_user.id,
            file_type=file_type,
            case_id=case_id,
            chat_session_id=chat_session_id
        )
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents(
    case_id: Optional[str] = None,
    chat_session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List documents for current user"""
    try:
        documents = storage_service.list_documents(
            user_id=current_user.id,
            case_id=case_id,
            chat_session_id=chat_session_id
        )
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific document"""
    try:
        document = await storage_service.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        if document.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this document")
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a document"""
    try:
        await storage_service.delete_document(document_id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        ) 