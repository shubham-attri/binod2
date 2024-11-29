from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from ...services.canvas import canvas_service
from ...core.auth import get_current_user
from ...models.base import User

router = APIRouter(prefix="/canvas", tags=["canvas"])

class CanvasCreate(BaseModel):
    title: str
    content: dict
    document_id: Optional[UUID] = None
    case_id: Optional[UUID] = None

class CanvasUpdate(BaseModel):
    content: dict

@router.post("/")
async def create_canvas(
    canvas_data: CanvasCreate,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Create a new canvas."""
    try:
        canvas = await canvas_service.create_canvas(
            title=canvas_data.title,
            user_id=current_user.id,
            content=canvas_data.content,
            document_id=canvas_data.document_id,
            case_id=canvas_data.case_id
        )
        return canvas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{canvas_id}")
async def get_canvas(
    canvas_id: UUID,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Get canvas by ID."""
    canvas = await canvas_service.get_canvas(canvas_id)
    if not canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")
    if canvas["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this canvas")
    return canvas

@router.put("/{canvas_id}")
async def update_canvas(
    canvas_id: UUID,
    canvas_update: CanvasUpdate,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Update canvas content."""
    canvas = await canvas_service.get_canvas(canvas_id)
    if not canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")
    if canvas["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this canvas")
    
    updated_canvas = await canvas_service.update_canvas(
        canvas_id=canvas_id,
        content=canvas_update.content
    )
    return updated_canvas

@router.get("/document/{document_id}")
async def get_document_canvases(
    document_id: UUID,
    current_user: User = Depends(get_current_user)
) -> List[dict]:
    """Get all canvases associated with a document."""
    canvases = await canvas_service.get_document_canvases(document_id)
    # Filter canvases for current user
    return [c for c in canvases if c["user_id"] == str(current_user.id)]

@router.get("/case/{case_id}")
async def get_case_canvases(
    case_id: UUID,
    current_user: User = Depends(get_current_user)
) -> List[dict]:
    """Get all canvases associated with a case."""
    canvases = await canvas_service.get_case_canvases(case_id)
    # Filter canvases for current user
    return [c for c in canvases if c["user_id"] == str(current_user.id)]

@router.post("/{canvas_id}/export")
async def export_canvas(
    canvas_id: UUID,
    format: str = "pdf",
    current_user: User = Depends(get_current_user)
) -> dict:
    """Export canvas to a file format."""
    canvas = await canvas_service.get_canvas(canvas_id)
    if not canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")
    if canvas["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to export this canvas")
    
    filepath = await canvas_service.export_canvas(canvas_id, format)
    if not filepath:
        raise HTTPException(status_code=500, detail="Failed to export canvas")
    
    return {"filepath": filepath} 