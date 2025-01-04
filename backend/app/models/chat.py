from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    id: str
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str
    created_at: str
    metadata: Optional[Dict[str, Any]] = None

class Citation(BaseModel):
    text: str
    document_id: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    context: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    content: str
    mode: str = Field(..., description="Either 'research' or 'case'")
    thread_id: Optional[str] = None
    case_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    citations: List[Citation] = []
    metadata: Dict[str, Any]
    
    class Config:
        schema_extra = {
            "example": {
                "message": {
                    "id": "123",
                    "role": "assistant",
                    "content": "I can help you with legal research and case analysis.",
                    "created_at": "2024-01-03T23:49:04.833149"
                },
                "citations": [],
                "metadata": {
                    "mode": "research",
                    "agent": "research_agent",
                    "confidence": 0.95
                }
            }
        } 