from datetime import datetime, timedelta
from typing import Any, Optional, Union
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from ..models.auth import TokenData, User
from .config import settings

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> User:
    """Get current user from JWT token"""
    # If in development mode and DEV_MODE is True, bypass authentication
    if settings.DEV_MODE:
        return User(email=settings.DEV_ADMIN_EMAIL, is_active=True)

    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        token_data = TokenData(email=email)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
        
    user = User(email=token_data.email, is_active=True)
    return user 

# Optional dependency for routes that don't require auth in dev mode
async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Union[str, None]:
    """Get current user from JWT token, but don't require it in dev mode"""
    if settings.DEV_MODE:
        return settings.DEV_ADMIN_EMAIL
        
    if not credentials:
        return None
        
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        return email if email else None
    except JWTError:
        return None