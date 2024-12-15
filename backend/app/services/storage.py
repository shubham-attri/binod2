from typing import Optional, BinaryIO, List
from app.services.supabase import get_supabase_client
from app.models.database import Document
import uuid
from datetime import datetime

class StorageService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.bucket_name = "documents"

    async def _ensure_bucket_exists(self):
        """Ensure the storage bucket exists"""
        try:
            await self.supabase.storage.get_bucket(self.bucket_name)
        except:
            await self.supabase.storage.create_bucket(self.bucket_name)

    async def upload_document(
        self,
        file: BinaryIO,
        filename: str,
        user_id: str,
        file_type: str,
        case_id: Optional[str] = None,
        chat_session_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> Document:
        """Upload document to Supabase Storage and create database entry"""
        
        await self._ensure_bucket_exists()
        
        # Generate unique storage path
        storage_path = f"{user_id}/{str(uuid.uuid4())}/{filename}"
        
        # Upload to storage
        await self.supabase.storage.from_(self.bucket_name).upload(
            storage_path,
            file
        )
        
        # Create database entry
        document = Document(
            id=uuid.uuid4(),
            user_id=user_id,
            name=filename,
            type=file_type,
            size=file.tell(),
            storage_path=storage_path,
            case_id=case_id,
            chat_session_id=chat_session_id,
            created_at=datetime.utcnow(),
            metadata=metadata
        )
        
        await self.supabase.table("documents").insert(document.dict())
        return document

    async def get_document(self, document_id: str) -> Optional[Document]:
        """Get document metadata and generate download URL"""
        result = await self.supabase.table("documents").select("*").eq("id", document_id).single()
        
        if not result:
            return None
            
        document = Document(**result)
        
        # Generate temporary download URL
        url = self.supabase.storage.from_(self.bucket_name).get_public_url(document.storage_path)
        document.metadata = document.metadata or {}
        document.metadata["download_url"] = url
        
        return document

    async def list_documents(
        self,
        user_id: str,
        case_id: Optional[str] = None,
        chat_session_id: Optional[str] = None
    ) -> List[Document]:
        """List documents for user/case/chat session"""
        query = self.supabase.table("documents").select("*").eq("user_id", user_id)
        
        if case_id:
            query = query.eq("case_id", case_id)
        if chat_session_id:
            query = query.eq("chat_session_id", chat_session_id)
            
        result = await query.execute()
        return [Document(**doc) for doc in result.data]

    async def delete_document(self, document_id: str):
        """Delete document from storage and database"""
        document = await self.get_document(document_id)
        if document:
            # Delete from storage
            await self.supabase.storage.from_(self.bucket_name).remove([document.storage_path])
            # Delete from database
            await self.supabase.table("documents").delete().eq("id", document_id) 