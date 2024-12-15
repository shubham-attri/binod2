from typing import Optional, List, Dict
from app.services.supabase import get_supabase_client
from app.models.database import ChatSession, ChatMessage, ChatMode
from app.services.ai_engine.base import AIEngine
import uuid
from datetime import datetime

class ChatService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.ai_engine = AIEngine()

    async def create_session(
        self,
        user_id: str,
        mode: ChatMode,
        case_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> ChatSession:
        """Create new chat session"""
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=user_id,
            mode=mode,
            case_id=case_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            metadata=metadata
        )
        
        await self.supabase.table("chat_sessions").insert(session.dict())
        return session

    async def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by ID"""
        result = await self.supabase.table("chat_sessions").select("*").eq("id", session_id).single()
        return ChatSession(**result) if result else None

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None
    ) -> ChatMessage:
        """Add message to chat session"""
        message = ChatMessage(
            id=uuid.uuid4(),
            session_id=session_id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
            metadata=metadata
        )
        
        # Update session
        await self.supabase.table("chat_sessions").update({
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", session_id)
        
        # Insert message
        await self.supabase.table("chat_messages").insert(message.dict())
        return message

    async def get_session_messages(
        self,
        session_id: str,
        limit: int = 50,
        before_id: Optional[str] = None
    ) -> List[ChatMessage]:
        """Get chat messages for session with pagination"""
        query = self.supabase.table("chat_messages").select("*").eq("session_id", session_id)
        
        if before_id:
            query = query.lt("id", before_id)
            
        query = query.order("created_at", desc=True).limit(limit)
        result = await query.execute()
        
        messages = [ChatMessage(**msg) for msg in result.data]
        return list(reversed(messages))  # Return in chronological order

    async def get_user_sessions(
        self,
        user_id: str,
        mode: Optional[ChatMode] = None,
        case_id: Optional[str] = None,
        limit: int = 10
    ) -> List[ChatSession]:
        """Get chat sessions for user"""
        query = self.supabase.table("chat_sessions").select("*").eq("user_id", user_id)
        
        if mode:
            query = query.eq("mode", mode)
        if case_id:
            query = query.eq("case_id", case_id)
            
        query = query.order("updated_at", desc=True).limit(limit)
        result = await query.execute()
        
        return [ChatSession(**session) for session in result.data]

    async def delete_session(self, session_id: str):
        """Delete chat session and all its messages"""
        # Delete messages first (foreign key constraint)
        await self.supabase.table("chat_messages").delete().eq("session_id", session_id)
        # Delete session
        await self.supabase.table("chat_sessions").delete().eq("id", session_id) 