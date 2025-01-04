from typing import List, Optional
from app.models.document import Document
from app.core.supabase import get_supabase_client
from app.core.config import get_settings
from datetime import datetime
from fastapi import HTTPException, UploadFile
import uuid
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class DocumentService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def save_file(self, file: UploadFile, user_id: str, mode: str = 'research') -> Document:
        """Save file to Supabase storage and create document record"""
        try:
            # Read file content
            content = await file.read()
            
            # Use existing folder structure
            storage_path = f"{user_id}/{mode}/{uuid.uuid4()}.{file.filename.split('.')[-1]}"
            
            # Upload to documents bucket
            storage_response = await self.supabase.storage \
                .from_('documents') \
                .upload(storage_path, content)

            if not storage_response.data:
                raise HTTPException(status_code=500, detail="Storage upload failed")

            # Get public URL
            file_url = self.supabase.storage \
                .from_('documents') \
                .get_public_url(storage_path)

            # Create document record using existing schema
            document_data = {
                "id": str(uuid.uuid4()),
                "title": file.filename,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "user_id": user_id,
                "file_path": file_url,
                "file_type": file.content_type,
                "file_size": len(content),
                "mode": mode,
                "folder_path": f"{mode}/{uuid.uuid4()}",
                "metadata": {}
            }

            # Insert into documents table
            result = await self.supabase.table('documents') \
                .insert(document_data) \
                .execute()

            if not result.data:
                raise HTTPException(status_code=500, detail="Database insert failed")

            return Document(**result.data[0])

        except Exception as e:
            logger.error(f"File save error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def list_documents(self, user_id: str) -> List[Document]:
        """List all documents for a user"""
        try:
            result = await self.supabase.table('documents') \
                .select('*') \
                .eq('user_id', user_id) \
                .execute()

            return [Document(**doc) for doc in result.data]
        except Exception as e:
            logger.error(f"List documents error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 