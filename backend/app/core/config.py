from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Legal AI Assistant"
    
    # Supabase Settings
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str
    
    # Redis Settings
    REDIS_URL: str = "redis://redis:6379"
    
    # AI Settings
    ANTHROPIC_API_KEY: str
    
    # Canvas Settings
    CANVAS_STORAGE_PATH: str = "/app/storage/canvas"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Security Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS Settings for Docker
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",     # Local development
        "http://127.0.0.1:3000",     # Alternative local
        "http://frontend:3000",      # Docker service
        "http://binod-frontend-1:3000"  # Docker container
    ]
    
    # Development Settings
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 