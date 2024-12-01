from fastapi import APIRouter, Depends, HTTPException
from app.models.chat import ChatMessage, ChatContext
from app.services.chat import ChatService
from app.core import settings
from app.core.security import get_optional_current_user
from typing import Optional, Union

router = APIRouter()
chat_service = ChatService()

@router.post("/message")
async def send_message(
    message: str,
    context_id: Optional[str] = None,
    user_id: Union[str, None] = Depends(get_optional_current_user)
):
    """Chat endpoint that maintains context in both dev and production modes"""
    try:
        # Get or create context
        context = None
        if context_id:
            context = await chat_service.get_context(context_id)
            if not context:
                raise HTTPException(status_code=404, detail="Context not found")
        else:
            # Create new context with user info
            metadata = {
                "user_id": user_id or settings.DEV_ADMIN_EMAIL,
                "mode": "development" if settings.DEV_MODE else "production"
            }
            context = await chat_service.create_context(metadata=metadata)
            context_id = context.context_id

        # Add user message to context
        user_message = ChatMessage(role="user", content=message)
        await chat_service.add_message(context_id, user_message)

        # Get AI response
        ai_message = await chat_service.get_response(message, context)
        await chat_service.add_message(context_id, ai_message)

        return {
            "message": ai_message,
            "context_id": context_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/context/{context_id}/messages")
async def get_messages(
    context_id: str,
    user_id: Union[str, None] = Depends(get_optional_current_user)
):
    """Get messages for a specific context"""
    try:
        context = await chat_service.get_context(context_id)
        if not context:
            raise HTTPException(status_code=404, detail="Context not found")
        
        # In dev mode or if user owns the context, return messages
        if settings.DEV_MODE or context.metadata.get("user_id") == user_id:
            return context.messages
        else:
            raise HTTPException(status_code=403, detail="Not authorized to access this context")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 