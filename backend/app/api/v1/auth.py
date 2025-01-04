from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, get_current_user
from app.core.config import get_settings
from app.models.auth import Token, User
from app.services.supabase import get_supabase_client
import logging
from supabase.lib.client_options import ClientOptions
from datetime import datetime, timedelta
from jose import jwt
import time
from fastapi import status

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

def create_access_token(data: dict):
    to_encode = data.copy()
    # Set longer expiration (e.g., 24 hours)
    expire = datetime.utcnow() + timedelta(hours=24)  # or adjust as needed
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """Login endpoint"""
    try:
        logger.info(f"Login attempt for user: {form_data.username}")
        
        # Create token
        token = create_access_token(
            data={
                "sub": "1d65261a-4fbb-4009-a103-9a8445525a80",  # Test user ID
                "email": form_data.username
            }
        )
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    try:
        logger.info(f"Getting user info for: {current_user['email']}")
        
        supabase = get_supabase_client()
        user_id = current_user['sub']
        
        try:
            # Get user data
            user_result = supabase.from_('users').select('*').eq('id', user_id).execute()
            
            # Check if we have data (user_result.data is a list)
            if not user_result.data:
                # User doesn't exist, create them
                logger.info(f"Creating new user with ID: {user_id}")
                user_data = {
                    'id': user_id,
                    'email': current_user['email'],
                    'is_active': True
                }
                
                try:
                    create_result = supabase.from_('users').insert(user_data).execute()
                    if create_result.data:
                        logger.info(f"Successfully created user: {user_id}")
                        return user_data
                    else:
                        logger.error("User creation returned no data")
                        return user_data  # Return basic info if creation fails
                except Exception as insert_error:
                    logger.error(f"Failed to create user: {str(insert_error)}")
                    return user_data  # Return basic info if creation fails
            
            # User exists, return their data
            user_data = user_result.data[0] if user_result.data else {
                "id": user_id,
                "email": current_user['email'],
                "is_active": True
            }
            
            return user_data
            
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            # Return basic user info if DB operations fail
            return {
                "id": user_id,
                "email": current_user['email'],
                "is_active": True
            }
            
    except Exception as e:
        logger.error(f"Error in /me endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh")
async def refresh_token(
    current_user: dict = Depends(get_current_user)
):
    """Refresh access token"""
    try:
        new_token = create_access_token(
            data={
                "sub": current_user["sub"],
                "email": current_user["email"]
            }
        )
        
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to refresh token"
        )

@router.get("/time")
async def check_time():
    """Debug endpoint to check time synchronization"""
    current_time = datetime.utcnow()
    return {
        "server_time": current_time.isoformat(),
        "timestamp": int(current_time.timestamp()),
        "timezone": time.tzname
    }