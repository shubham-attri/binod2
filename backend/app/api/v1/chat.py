from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any
from pydantic import BaseModel
from ...core.auth import get_current_user
from ...services.research import research_service
from ...services.document import document_service
from ...models.base import User

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatQuery(BaseModel):
    query: str
    document_id: Optional[str] = None
    document_type: Optional[str] = None
    thread_id: Optional[str] = None

@router.post("/analyze")
async def analyze_query(
    chat_query: ChatQuery,
    current_user: User = Depends(get_current_user)
):
    """Analyze query and stream response"""
    try:
        async def generate_response():
            # If document is provided, first process it
            if chat_query.document_id:
                async for chunk in document_service.analyze_document(
                    chat_query.document_id,
                    chat_query.query
                ):
                    yield f"data: {chunk}\n\n"
            else:
                # Get streaming response from research service
                async for chunk in research_service.get_text_response(
                    chat_query.query,
                    chat_query.thread_id
                ):
                    yield f"data: {chunk}\n\n"

        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        ) 