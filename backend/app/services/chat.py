from typing import AsyncGenerator
from app.core.config import settings
from app.agents.orchestrator import AgentOrchestrator
from langgraph.checkpoint.memory import MemorySaver
import logging

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.memory = MemorySaver()
        logger.info("ChatService initialized with orchestrator")

    async def get_streaming_response(
        self, 
        message: str, 
        mode: str = "research",
        thread_id: str = None
    ) -> AsyncGenerator[str, None]:
        """Get streaming response from appropriate agent"""
        try:
            result = await self.orchestrator.process_query(
                message,
                mode=mode,
                thread_id=thread_id
            )
            
            # Get last message content
            if result["messages"]:
                last_message = result["messages"][-1]
                for char in last_message.content:
                    yield char
                    
        except Exception as e:
            logger.error(f"Error getting AI response: {str(e)}")
            raise 