from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Document(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    user_id: str
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None 