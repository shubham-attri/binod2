from pydantic import BaseModel # type: ignore
from typing import Optional, List, Dict, Any, Union, Literal

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatMessage(BaseModel):
    content: str
    file_Url: Optional[str] = None
    quote: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    thinking_steps: list[str]

# WebSocket Message Models
class WebSocketMessage(BaseModel):
    type: str
    payload: Dict[str, Any]
    session_id: str
    
class UserMessage(WebSocketMessage):
    type: Literal["user_message"] = "user_message"
    payload: Dict[str, Any]

class AIResponseChunk(WebSocketMessage):
    type: Literal["ai_response_chunk"] = "ai_response_chunk"
    payload: Dict[str, Any]

class ThinkingStep(WebSocketMessage):
    type: Literal["thinking_step"] = "thinking_step"
    payload: Dict[str, Any]

class EditorContext(WebSocketMessage):
    type: Literal["editor_context"] = "editor_context"
    payload: Dict[str, Any]

class AutocompleteRequest(WebSocketMessage):
    type: Literal["autocomplete_request"] = "autocomplete_request"
    payload: Dict[str, Any]

class Suggestion(WebSocketMessage):
    type: Literal["suggestion"] = "suggestion"
    payload: Dict[str, Any]

# Document Generation Models
class DocumentRequest(BaseModel):
    template: str
    variables: Dict[str, Any]

class DocumentUpdateRequest(BaseModel):
    variables: Dict[str, Any]

# RAG Models
class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 5
    filters: Optional[Dict[str, Any]] = None

# Vector Search Models
class VectorSearchRequest(BaseModel):
    text: str
    top_k: int = 5
    namespace: Optional[str] = None 