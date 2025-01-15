from pydantic import BaseModel # type: ignore
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatMessage(BaseModel):
    content: str

class ChatResponse(BaseModel):
    content: str
    thinking_steps: list[str] 