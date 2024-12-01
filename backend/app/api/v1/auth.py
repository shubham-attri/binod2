from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, get_current_user
from app.core.config import get_settings
from app.models.auth import Token, User
from app.services.supabase import get_supabase_client
import logging

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint that uses Supabase authentication"""
    try:
        # Log incoming request
        logger.info(f"Login attempt for user: {form_data.username}")
        
        # Development mode bypass
        if settings.DEV_MODE and form_data.username == settings.DEV_ADMIN_EMAIL:
            logger.info("Using development mode authentication")
            access_token = create_access_token(
                data={"sub": settings.DEV_ADMIN_EMAIL}
            )
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }

        # Production mode with Supabase
        supabase = get_supabase_client()
        try:
            response = supabase.auth.sign_in_with_password({
                "email": form_data.username,
                "password": form_data.password
            })
            
            if not response.user:
                logger.error("No user returned from Supabase")
                raise HTTPException(
                    status_code=401,
                    detail="Authentication failed - no user returned"
                )
            
            # Create access token
            access_token = create_access_token(
                data={"sub": response.user.email}
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }
            
        except Exception as supabase_error:
            logger.error(f"Supabase authentication error: {str(supabase_error)}")
            raise HTTPException(
                status_code=401,
                detail=f"Authentication failed: {str(supabase_error)}"
            )
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during login: {str(e)}"
        )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user