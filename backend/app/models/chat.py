from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID, uuid4

class ChatMessage(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = None

class ChatContext(BaseModel):
    context_id: Optional[UUID] = None
    messages: List[ChatMessage] = []
    metadata: Optional[dict] = None

class ChatRequest(BaseModel):
    message: str
    context_id: Optional[UUID] = None
    metadata: Optional[dict] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    context_id: UUID
    metadata: Optional[dict] = None 