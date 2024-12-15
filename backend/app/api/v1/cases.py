from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from app.core.security import get_current_user
from app.models.auth import User
from app.models.database import Case, CaseActivity, CaseStatus
from app.services.case import CaseService
from pydantic import BaseModel

router = APIRouter()
case_service = CaseService()

class CaseCreate(BaseModel):
    title: str
    description: str
    metadata: Optional[dict] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    metadata: Optional[dict] = None

@router.post("")
async def create_case(
    case_data: CaseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new case"""
    try:
        case = await case_service.create_case(
            user_id=str(current_user.id),
            title=case_data.title,
            description=case_data.description,
            metadata=case_data.metadata
        )
        return case
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create case: {str(e)}"
        )

@router.get("/{case_id}")
async def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get case details"""
    case = await case_service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.put("/{case_id}")
async def update_case(
    case_id: str,
    case_data: CaseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update case details"""
    try:
        case = await case_service.update_case(
            case_id=case_id,
            title=case_data.title,
            description=case_data.description,
            status=case_data.status,
            metadata=case_data.metadata
        )
        return case
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update case: {str(e)}"
        )

@router.get("")
async def list_cases(
    status: Optional[CaseStatus] = None,
    current_user: User = Depends(get_current_user)
):
    """List cases for user"""
    cases = await case_service.get_user_cases(
        user_id=str(current_user.id),
        status=status
    )
    return cases

@router.get("/{case_id}/activities")
async def get_case_activities(
    case_id: str,
    limit: int = 50,
    before_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get case activities"""
    activities = await case_service.get_case_activities(
        case_id=case_id,
        limit=limit,
        before_id=before_id
    )
    return activities

@router.post("/{case_id}/archive")
async def archive_case(
    case_id: str,
    current_user: User = Depends(get_current_user)
):
    """Archive a case"""
    try:
        case = await case_service.archive_case(case_id)
        return case
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to archive case: {str(e)}"
        ) 