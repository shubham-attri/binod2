from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.models.chat import ChatMessage, ChatRequest, ChatResponse
from app.core.security import get_current_user
from app.models.auth import User
from app.services.ai import get_ai_response
from datetime import datetime
import json
import logging

router = APIRouter()

@router.post("", response_model=ChatResponse)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """Handle chat requests with optional streaming"""
    try:
        # Check if client accepts streaming responses
        accept_header = request.headers.get("accept", "")
        accept_stream = "text/event-stream" in accept_header.lower()
        
        if accept_stream:
            # Return streaming response
            async def event_generator():
                async for text in await get_ai_response(
                    chat_request.content,
                    current_user,
                    mode=chat_request.mode,
                    case_id=chat_request.case_id,
                    stream=True
                ):
                    if text:
                        yield f"data: {json.dumps({'content': text})}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream"
            )
        else:
            # Return regular response
            content = await get_ai_response(
                chat_request.content,
                current_user,
                mode=chat_request.mode,
                case_id=chat_request.case_id,
                stream=False
            )
            
            return ChatResponse(
                message=ChatMessage(
                    role="assistant",
                    content=content,
                    created_at=datetime.utcnow().isoformat()
                )
            )
            
    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat request: {str(e)}"
        )

@router.get("/history")
async def get_chat_history(
    case_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get chat history for user or specific case"""
    # TODO: Implement chat history retrieval
    pass 