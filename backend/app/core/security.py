from datetime import datetime, timedelta
from typing import Any, Optional, Union
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Add debug logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict) -> str:
    """Create JWT access token with proper expiration"""
    try:
        to_encode = data.copy()
        
        # Get current UTC time with microsecond precision
        current_time = datetime.utcnow()
        
        # Debug time information
        logger.debug("Time debug:")
        logger.debug(f"System time (UTC): {current_time.isoformat()}")
        logger.debug(f"System timestamp: {int(current_time.timestamp())}")
        
        # Calculate expiration
        expire = current_time + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        exp_timestamp = int(expire.timestamp())
        
        # More debug info
        logger.debug(f"Expiration time (UTC): {expire.isoformat()}")
        logger.debug(f"Expiration timestamp: {exp_timestamp}")
        logger.debug(f"Time until expiration: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        
        # Set claims
        to_encode.update({
            "iat": int(current_time.timestamp()),  # Issued at
            "exp": exp_timestamp,                  # Expiration
            "nbf": int(current_time.timestamp())   # Not valid before
        })
        
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    except Exception as e:
        logger.error(f"Token creation failed: {str(e)}")
        raise

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None or email is None:
            logger.error("Invalid token payload")
            raise credentials_exception
            
        return {
            "sub": user_id,     # Consistently use 'sub' for the user ID
            "email": email
        }
    except JWTError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise credentials_exception

async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Optional[str]:
    """Get current user from JWT token, but don't require it"""
    if not credentials:
        return None
        
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

async def verify_token(token: str) -> dict:
    """Verify JWT token with detailed logging"""
    try:
        logger.debug(f"Verifying token: {token[:20]}...")
        
        # Decode token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Get expiration
        exp = datetime.fromtimestamp(payload["exp"])
        now = datetime.utcnow()
        time_left = exp - now
        
        logger.debug(f"Token exp: {exp.isoformat()}")
        logger.debug(f"Current time: {now.isoformat()}")
        logger.debug(f"Time left: {time_left.total_seconds()} seconds")
        
        return payload
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        raise
    except jwt.JWTError as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise