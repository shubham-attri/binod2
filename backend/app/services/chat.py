from uuid import uuid4
from datetime import datetime
from langchain_anthropic import ChatAnthropic
from langchain.schema import SystemMessage, HumanMessage
from app.models.chat import ChatMessage, ChatContext
from app.core.config import settings
from app.core.supabase import get_supabase

class ChatService:
    def __init__(self):
        self.llm = ChatAnthropic(
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            model_name="claude-3-opus-20240229",
            max_tokens=4000,
            temperature=0.7
        )
        self.supabase = get_supabase()

    async def get_context(self, context_id: str) -> ChatContext:
        """Get chat context from Supabase"""
        result = await self.supabase.table("chat_contexts").select("*").eq("id", context_id).single()
        if not result:
            return None
        return ChatContext(**result)

    async def create_context(self, metadata: dict = None) -> ChatContext:
        """Create new chat context in Supabase"""
        context_id = str(uuid4())
        context = ChatContext(
            context_id=context_id,
            messages=[],
            metadata=metadata
        )
        await self.supabase.table("chat_contexts").insert(context.dict())
        return context

    async def add_message(self, context_id: str, message: ChatMessage) -> None:
        """Add message to chat context in Supabase"""
        await self.supabase.table("chat_messages").insert({
            **message.dict(),
            "context_id": context_id
        })

    async def get_response(self, message: str, context: ChatContext = None) -> ChatMessage:
        """Get response from Anthropic Claude"""
        messages = []
        
        # Add system message
        messages.append(SystemMessage(content="""You are Agent Binod, a powerful AI legal assistant. 
        You help with legal research, case management, and document analysis. 
        You are direct, professional, and always cite your sources."""))

        # Add context messages
        if context and context.messages:
            for msg in context.messages[-5:]:  # Use last 5 messages for context
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                else:
                    messages.append(SystemMessage(content=msg.content))

        # Add current message
        messages.append(HumanMessage(content=message))

        # Get response
        response = await self.llm.agenerate([messages])
        
        return ChatMessage(
            role="assistant",
            content=response.generations[0][0].text,
            created_at=datetime.utcnow()
        ) 