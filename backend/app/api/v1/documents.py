from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.models.document import Document
from app.services.document import DocumentService
from app.utils.auth import get_current_user

router = APIRouter()
document_service = DocumentService()

@router.get("/list")
async def list_documents(
    case_id: Optional[str] = None,
    session_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[Document]:
    try:
        return await document_service.list_documents(
            user_id=current_user["id"],
            case_id=case_id,
            session_id=session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 