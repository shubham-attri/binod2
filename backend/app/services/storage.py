from typing import BinaryIO, Optional
from app.models.document import Document
from app.services.supabase import get_supabase_client
from datetime import datetime
import uuid

class StorageService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.bucket_name = "documents"

    def _ensure_bucket_exists(self):
        """Ensure the storage bucket exists"""
        try:
            buckets = self.supabase.storage.list_buckets()
            if not any(b['name'] == self.bucket_name for b in buckets):
                self.supabase.storage.create_bucket(self.bucket_name, {'public': False})
        except Exception as e:
            # Create bucket if it doesn't exist
            self.supabase.storage.create_bucket(self.bucket_name, {'public': False})

    def upload_document(
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
        
        self._ensure_bucket_exists()
        
        # Generate unique storage path
        storage_path = f"{user_id}/{str(uuid.uuid4())}/{filename}"
        
        # Upload to storage using from_ method
        self.supabase.storage.from_(self.bucket_name).upload(
            path=storage_path,
            file=file,
            file_options={"content-type": file_type}
        )
        
        # Create database entry
        document = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": filename,
            "file_type": file_type,
            "file_size": file.tell(),
            "storage_path": storage_path,
            "case_id": case_id,
            "session_id": chat_session_id,
            "created_at": datetime.utcnow().isoformat(),
            "metadata": metadata
        }
        
        result = self.supabase.table("documents").insert(document).execute()
        return Document(**result.data[0])

    def get_document(self, document_id: str) -> Optional[Document]:
        """Get document by ID"""
        result = self.supabase.table("documents").select("*").eq("id", document_id).execute()
        if result.data:
            return Document(**result.data[0])
        return None

    def list_documents(
        self,
        user_id: str,
        case_id: Optional[str] = None,
        chat_session_id: Optional[str] = None
    ) -> list[Document]:
        """List documents for user, optionally filtered by case or chat session"""
        query = self.supabase.table("documents").select("*").eq("user_id", user_id)
        
        if case_id:
            query = query.eq("case_id", case_id)
        if chat_session_id:
            query = query.eq("session_id", chat_session_id)
            
        result = query.execute()
        return [Document(**doc) for doc in result.data]

    def delete_document(self, document_id: str):
        """Delete document from storage and database"""
        document = self.get_document(document_id)
        if document:
            # Delete from storage
            self.supabase.storage.from_(self.bucket_name).remove([document.storage_path])
            # Delete from database
            self.supabase.table("documents").delete().eq("id", document_id).execute() 