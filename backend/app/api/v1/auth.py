from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, get_current_user
from app.core.config import get_settings
from app.models.auth import Token, User
from app.services.supabase import get_supabase_client
import logging
from supabase.lib.client_options import ClientOptions

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint that uses Supabase authentication"""
    try:
        logger.info(f"Login attempt for user: {form_data.username}")
        
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
                    detail="Invalid email or password"
                )
            
            # Create access token with user's email
            user_email = response.user.email
            logger.info(f"Creating access token for user: {user_email}")
            access_token = create_access_token(
                data={"sub": user_email}
            )
            
            print(access_token)
            logger.info(f"Login successful for user: {user_email}")
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }
            
        except Exception as supabase_error:
            error_msg = str(supabase_error)
            logger.error(f"Supabase authentication error: {error_msg}")
            
            # Handle specific Supabase errors
            if "Invalid login credentials" in error_msg:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )
            elif "Email not confirmed" in error_msg:
                raise HTTPException(
                    status_code=401,
                    detail="Please verify your email address"
                )
            elif "Rate limit" in error_msg:
                raise HTTPException(
                    status_code=429,
                    detail="Too many login attempts. Please try again later"
                )
            else:
                raise HTTPException(
                    status_code=401,
                    detail="Authentication failed. Please try again"
                )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again later"
        )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    logger.info(f"Getting user info for: {current_user.email}")
    return current_user