from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.models.chat import ChatRequest, ChatResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=ChatResponse)
async def send_message(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    logger.info(f"Processing chat request: {request.content}")
    try:
        return ChatResponse(response=f"Received: {request.content}")
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 