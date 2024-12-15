from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from typing import Optional, List
from app.core.security import get_current_user
from app.models.auth import User
from app.models.database import Document
from app.services.storage import StorageService
import mimetypes

router = APIRouter()
storage_service = StorageService()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    case_id: Optional[str] = None,
    chat_session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Upload a document"""
    try:
        # Guess file type from extension
        file_type, _ = mimetypes.guess_type(file.filename)
        if not file_type:
            file_type = "application/octet-stream"
            
        document = await storage_service.upload_document(
            file=file.file,
            filename=file.filename,
            user_id=str(current_user.id),
            file_type=file_type,
            case_id=case_id,
            chat_session_id=chat_session_id
        )
        
        return document
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get document details and download URL"""
    document = await storage_service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.get("/list")
async def list_documents(
    case_id: Optional[str] = None,
    chat_session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List documents for user/case/chat session"""
    documents = await storage_service.list_documents(
        user_id=str(current_user.id),
        case_id=case_id,
        chat_session_id=chat_session_id
    )
    return documents

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