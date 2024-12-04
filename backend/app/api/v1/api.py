from fastapi import APIRouter
from .auth import router as auth_router
from .chat import router as chat_router

router = APIRouter()

# Include routers
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(chat_router, prefix="/chat", tags=["chat"]) 