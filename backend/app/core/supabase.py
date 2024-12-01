from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client
supabase_client: Client = None

def init_supabase() -> None:
    """Initialize Supabase client"""
    global supabase_client
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        raise

def get_supabase() -> Client:
    """Get Supabase client instance"""
    if not supabase_client:
        init_supabase()
    return supabase_client 