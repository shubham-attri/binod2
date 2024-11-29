from typing import Optional, Dict, Any, List
from uuid import UUID
import json
import os
from pathlib import Path

from .supabase import supabase_service
from .redis import redis_service
from ..core.config import get_settings

settings = get_settings()

class CanvasService:
    def __init__(self):
        self.storage_path = Path(settings.CANVAS_STORAGE_PATH)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    async def create_canvas(self, 
                          title: str,
                          user_id: UUID,
                          content: Dict[str, Any],
                          document_id: Optional[UUID] = None,
                          case_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Create a new canvas with document annotations."""
        
        canvas_data = {
            "title": title,
            "content": content,
            "user_id": str(user_id),
            "document_id": str(document_id) if document_id else None,
            "case_id": str(case_id) if case_id else None
        }
        
        # Store in Supabase
        canvas = await supabase_service.create_canvas(canvas_data)
        
        # If there's a document, update its metadata
        if document_id:
            document = await supabase_service.get_document(document_id)
            if document:
                metadata = document.get("metadata", {}) or {}
                canvas_refs = metadata.get("canvas_refs", [])
                canvas_refs.append(str(canvas["id"]))
                metadata["canvas_refs"] = canvas_refs
                
                await supabase_service.update_document(
                    document_id,
                    {"metadata": metadata}
                )
        
        return canvas

    async def get_canvas(self, canvas_id: UUID) -> Optional[Dict[str, Any]]:
        """Get canvas by ID."""
        return await supabase_service.get_canvas(canvas_id)

    async def update_canvas(self,
                          canvas_id: UUID,
                          content: Dict[str, Any]) -> Dict[str, Any]:
        """Update canvas content."""
        return await supabase_service.update_canvas(canvas_id, {"content": content})

    async def get_document_canvases(self,
                                  document_id: UUID) -> List[Dict[str, Any]]:
        """Get all canvases associated with a document."""
        return await supabase_service.get_document_canvases(document_id)

    async def get_case_canvases(self,
                               case_id: UUID) -> List[Dict[str, Any]]:
        """Get all canvases associated with a case."""
        return await supabase_service.get_case_canvases(case_id)

    async def export_canvas(self,
                          canvas_id: UUID,
                          format: str = "pdf") -> Optional[str]:
        """Export canvas to a file format."""
        canvas = await self.get_canvas(canvas_id)
        if not canvas:
            return None
            
        # Generate unique filename
        filename = f"canvas_{canvas_id}.{format}"
        filepath = self.storage_path / filename
        
        # Export logic here (placeholder)
        # This would convert the canvas content to the requested format
        
        return str(filepath)

canvas_service = CanvasService() 