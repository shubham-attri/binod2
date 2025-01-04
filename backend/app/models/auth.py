from pydantic import BaseModel

class User(BaseModel):
    id: str
    email: str
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int 