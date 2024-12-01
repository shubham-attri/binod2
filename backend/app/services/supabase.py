from supabase import create_client, Client
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

_supabase_client = None

def get_supabase_client() -> Client:
    """Get Supabase client instance with proper error handling"""
    global _supabase_client
    
    if _supabase_client is None:
        try:
            logger.info("Initializing Supabase client...")
            _supabase_client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY,
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    return _supabase_client 