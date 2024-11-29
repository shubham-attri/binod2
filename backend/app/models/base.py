from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID, uuid4

class User(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    email: EmailStr
    full_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    user_id: UUID
    case_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Case(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    description: Optional[str] = None
    status: str = "active"
    client_info: Optional[Dict[str, Any]] = None
    documents: List[UUID] = Field(default_factory=list)
    user_id: UUID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Document(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    content: str
    file_type: str
    metadata: Optional[Dict[str, Any]] = None
    case_id: Optional[UUID] = None
    user_id: UUID
    vector_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Canvas(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    content: Dict[str, Any]
    document_id: Optional[UUID] = None
    case_id: Optional[UUID] = None
    user_id: UUID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResearchQuery(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    user_id: UUID
    case_id: Optional[UUID] = None

class ResearchResponse(BaseModel):
    query_id: UUID
    content: str
    sources: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None
  