from fastapi import APIRouter
from .auth import router as auth_router
from .chat import router as chat_router
from .documents import router as documents_router
from .cases import router as cases_router

router = APIRouter()

# Include routers
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(documents_router, prefix="/documents", tags=["documents"])
router.include_router(cases_router, prefix="/cases", tags=["cases"]) 