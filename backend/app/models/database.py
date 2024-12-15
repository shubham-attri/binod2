from pydantic import BaseModel, UUID4
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum

class ChatMode(str, Enum):
    RESEARCH = "research"
    CASE = "case"

class ChatSession(BaseModel):
    id: UUID4
    user_id: UUID4
    mode: ChatMode
    case_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict] = None

class ChatMessage(BaseModel):
    id: UUID4
    session_id: UUID4
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime
    metadata: Optional[Dict] = None

class Document(BaseModel):
    id: UUID4
    user_id: UUID4
    name: str
    type: str
    size: int
    storage_path: str
    case_id: Optional[UUID4] = None
    chat_session_id: Optional[UUID4] = None
    created_at: datetime
    metadata: Optional[Dict] = None

class CaseStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"
    PENDING = "pending"

class Case(BaseModel):
    id: UUID4
    user_id: UUID4
    title: str
    description: str
    status: CaseStatus
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict] = None

class ActivityType(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    DOCUMENT_ADDED = "document_added"
    MESSAGE_SENT = "message_sent"
    STATUS_CHANGED = "status_changed"

class CaseActivity(BaseModel):
    id: UUID4
    case_id: UUID4
    activity_type: ActivityType
    description: str
    created_at: datetime
    metadata: Optional[Dict] = None 