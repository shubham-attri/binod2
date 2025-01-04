from fastapi import APIRouter, Depends, HTTPException
from app.models.chat import ChatMessage, ChatRequest, ChatResponse, Citation
from app.core.security import get_current_user
from app.agents.orchestrator import AgentOrchestrator
from datetime import datetime
import logging
import uuid
from typing import List, Optional
from app.models.auth import User

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize the orchestrator
agent_orchestrator = AgentOrchestrator()

@router.post("", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Process chat messages through agent orchestrator"""
    try:
        logger.info(f"Processing chat request: mode={chat_request.mode}")
        
        # Process through orchestrator
        result = await agent_orchestrator.process_query(
            query=chat_request.content,
            mode=chat_request.mode,
            thread_id=chat_request.thread_id,
            user_id=current_user["sub"],
            user_email=current_user["email"],
            metadata=chat_request.metadata
        )
        
        # Create response message
        message = ChatMessage(
            id=str(uuid.uuid4()),
            role="assistant",
            content=result.get("output", "No response generated"),
            created_at=datetime.utcnow().isoformat(),
            metadata={
                "agent": result.get("agent", ""),
                "confidence": result.get("confidence", 1.0)
            }
        )
        
        # Process citations if any
        citations = []
        if result.get("citations"):
            for cite in result["citations"]:
                citations.append(Citation(
                    text=cite["text"],
                    document_id=cite["document_id"],
                    relevance_score=cite["score"],
                    context=cite.get("context"),
                    metadata=cite.get("metadata")
                ))
        
        # Prepare metadata
        metadata = {
            "mode": chat_request.mode,
            "user_id": current_user["sub"],
            "user_email": current_user["email"],
            "thread_id": chat_request.thread_id,
            "agent": result.get("agent", ""),
            "processing_time": result.get("processing_time"),
            "tool_calls": result.get("tool_calls", [])
        }
        
        if chat_request.case_id:
            metadata["case_id"] = chat_request.case_id
        
        return ChatResponse(
            message=message,
            citations=citations,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process chat request: {str(e)}"
        )

@router.get("/history", response_model=List[ChatMessage])
async def get_chat_history(
    case_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get chat history for user or specific case"""
    try:
        # TODO: Implement actual chat history retrieval
        return []
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chat history: {str(e)}"
        ) 