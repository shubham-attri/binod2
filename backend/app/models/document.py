from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Document(BaseModel):
    id: str
    user_id: str
    title: str
    storage_path: str
    file_type: str
    file_size: int
    case_id: Optional[str] = None
    session_id: Optional[str] = None
    content: Optional[str] = None
    content_vector: Optional[list[float]] = None
    created_at: str
    updated_at: Optional[str] = None
    metadata: Optional[dict] = None 