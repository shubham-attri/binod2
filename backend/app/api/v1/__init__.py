from fastapi import APIRouter
from . import canvas
from . import documents

router = APIRouter()

router.include_router(canvas.router)
router.include_router(documents.router) 