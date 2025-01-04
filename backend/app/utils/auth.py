from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current authenticated user"""
    try:
        logger.debug(f"Verifying token: {credentials.credentials[:20]}...")
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        logger.debug(f"Token payload: {payload}")
        
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload"
            )
            
        return {
            "id": user_id,
            "email": email,
            "is_active": True
        }
    except JWTError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Token verification failed"
        ) 