from typing import List, Optional
from app.models.document import Document
from app.core.supabase import get_supabase_client
from datetime import datetime
from fastapi import HTTPException

class DocumentService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def list_documents(
        self,
        user_id: str,
        case_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> List[Document]:
        try:
            # First get user's UUID from email
            user_result = await self.supabase.from_('users').select('id').eq('email', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_uuid = user_result.data['id']
            
            # Now query documents with UUID
            query = self.supabase.table('documents').select('*')
            query = query.eq('user_id', user_uuid)
            
            if case_id:
                query = query.eq('case_id', case_id)
            if session_id:
                query = query.eq('session_id', session_id)
            
            result = await query.execute()
            return [Document(**doc) for doc in result.data]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def create_document(
        self,
        user_id: str,
        file_name: str,
        content: bytes,
        mode: str,  # 'research' or 'case'
        case_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Document:
        try:
            # Get user UUID from email
            user_result = await self.supabase.from_('users').select('id').eq('email', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_uuid = user_result.data['id']
            bucket_id = f"user_{user_uuid}"
            
            # Construct folder path based on mode
            if mode == 'research':
                folder_path = f"research/{session_id}" if session_id else "research/general"
            else:  # case mode
                folder_path = f"cases/{case_id}" if case_id else "cases/general"
            
            # Storage path includes folder structure
            storage_path = f"{folder_path}/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file_name}"
            
            # Upload to user's bucket
            await self.supabase.storage.from_(bucket_id).upload(storage_path, content)
            
            # Create document record
            document_data = {
                "user_id": user_uuid,
                "file_name": file_name,
                "storage_path": storage_path,
                "folder_path": folder_path,
                "mode": mode,
                "case_id": case_id,
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = await self.supabase.table('documents').insert(document_data).execute()
            return Document(**result.data[0])
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 