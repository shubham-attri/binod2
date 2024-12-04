from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime

class ChatMessage(BaseModel):
    id: Optional[str] = None
    role: Literal["user", "assistant"]
    content: str
    created_at: str = datetime.utcnow().isoformat()
    metadata: Optional[dict] = None

class ChatRequest(BaseModel):
    content: str
    mode: Literal["research", "case"] = "research"
    case_id: Optional[str] = None
    metadata: Optional[dict] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    citations: Optional[List[dict]] = None
    metadata: Optional[dict] = None

class ChatHistory(BaseModel):
    messages: List[ChatMessage]
    metadata: Optional[dict] = None 