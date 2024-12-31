from typing import List, Optional
from app.models.document import Document
from app.core.supabase import get_supabase_client

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
            # Build query
            query = self.supabase.table('documents').select('*')
            
            # Add filters
            query = query.eq('user_id', user_id)
            if case_id:
                query = query.eq('case_id', case_id)
            if session_id:
                query = query.eq('session_id', session_id)
            
            # Execute query
            result = await query.execute()
            return [Document(**doc) for doc in result.data]
            
        except Exception as e:
            raise e 