from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import os

from .core.config import get_settings
from .models.base import Message, Case
from .services.research import research_service
from .api.v1 import canvas, chat, documents

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for Legal AI Assistant with research and case management capabilities",
    version="1.0.0"
)

# Configure CORS for Docker environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend in dev
        "http://frontend:3000",   # Frontend container
        "http://127.0.0.1:3000",  # Alternative local access
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(canvas.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": os.getenv("NODE_ENV", "development"),
        "services": {
            "redis": "connected" if research_service.redis.ping() else "disconnected",
            "supabase": "configured"
        }
    }

@app.get(f"{settings.API_V1_STR}/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Legal AI Assistant API",
        "docs": "/docs",
        "health": "/health"
    } 