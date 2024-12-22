from fastapi import APIRouter, Depends, HTTPException
from app.models.chat import ChatMessage, ChatRequest, ChatResponse
from app.core.security import get_current_user
from app.models.auth import User
from datetime import datetime
import uuid

router = APIRouter()

@router.post("", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Simple chat endpoint that returns a dummy response.
    Mode can be either 'research' or 'case'.
    """
    try:
        # Create a dummy response
        message = ChatMessage(
            id=str(uuid.uuid4()),
            role="assistant",
            content=f"This is a dummy response to your query: {chat_request.content}",
            created_at=datetime.utcnow().isoformat()
        )
        
        return ChatResponse(
            message=message,
            citations=[],  # Empty citations for now
            metadata={"mode": chat_request.mode}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_chat_history(
    case_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get chat history for user or specific case"""
    # TODO: Implement chat history retrieval
    pass 