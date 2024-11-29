from supabase import create_client, Client
from ..core.config import get_settings
from typing import Optional, Dict, Any, List
from uuid import UUID
import json

settings = get_settings()

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )

    async def get_user(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        response = await self.client.table('users').select('*').eq('id', str(user_id)).single().execute()
        return response.data

    async def create_case(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.client.table('cases').insert(case_data).execute()
        return response.data[0]

    async def get_case(self, case_id: UUID) -> Optional[Dict[str, Any]]:
        response = await self.client.table('cases').select('*').eq('id', str(case_id)).single().execute()
        return response.data

    async def create_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.client.table('documents').insert(document_data).execute()
        return response.data[0]

    async def get_document(self, document_id: UUID) -> Optional[Dict[str, Any]]:
        response = await self.client.table('documents').select('*').eq('id', str(document_id)).single().execute()
        return response.data

    async def update_document(self, document_id: UUID, updates: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.client.table('documents').update(updates).eq('id', str(document_id)).execute()
        return response.data[0]

    async def create_canvas(self, canvas_data: Dict[str, Any]) -> Dict[str, Any]:
        # Ensure content is JSON serializable
        canvas_data['content'] = json.dumps(canvas_data['content'])
        response = await self.client.table('canvas').insert(canvas_data).execute()
        return response.data[0]

    async def get_canvas(self, canvas_id: UUID) -> Optional[Dict[str, Any]]:
        response = await self.client.table('canvas').select('*').eq('id', str(canvas_id)).single().execute()
        if response.data:
            response.data['content'] = json.loads(response.data['content'])
        return response.data

    async def update_canvas(self, canvas_id: UUID, updates: Dict[str, Any]) -> Dict[str, Any]:
        if 'content' in updates:
            updates['content'] = json.dumps(updates['content'])
        response = await self.client.table('canvas').update(updates).eq('id', str(canvas_id)).execute()
        if response.data:
            response.data[0]['content'] = json.loads(response.data[0]['content'])
        return response.data[0]

    async def get_document_canvases(self, document_id: UUID) -> List[Dict[str, Any]]:
        response = await self.client.table('canvas').select('*').eq('document_id', str(document_id)).execute()
        for canvas in response.data:
            canvas['content'] = json.loads(canvas['content'])
        return response.data

    async def get_case_canvases(self, case_id: UUID) -> List[Dict[str, Any]]:
        response = await self.client.table('canvas').select('*').eq('case_id', str(case_id)).execute()
        for canvas in response.data:
            canvas['content'] = json.loads(canvas['content'])
        return response.data

    async def create_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.client.table('messages').insert(message_data).execute()
        return response.data[0]

    async def get_case_messages(self, case_id: UUID) -> List[Dict[str, Any]]:
        response = await self.client.table('messages').select('*').eq('case_id', str(case_id)).order('created_at').execute()
        return response.data

    async def create_research_query(self, query_data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.client.table('research_queries').insert(query_data).execute()
        return response.data[0]

    async def create_research_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.client.table('research_responses').insert(response_data).execute()
        return response.data[0]

supabase_service = SupabaseService() 