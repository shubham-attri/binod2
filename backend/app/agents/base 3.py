from typing import Dict, Any
from langchain_core.messages import BaseMessage
from langchain_anthropic import ChatAnthropic
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class BaseAgent:
    """Base agent class with common functionality"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.llm = ChatAnthropic(
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            model_name=settings.ANTHROPIC_MODEL
        )
        logger.info(f"Initialized {name} agent")
    
    async def process(self, messages: list[BaseMessage], **kwargs) -> Dict[str, Any]:
        """Process messages and return response"""
        try:
            response = await self.llm.ainvoke(messages)
            return {
                "output": response.content,
                "agent": self.name,
                "metadata": kwargs
            }
        except Exception as e:
            logger.error(f"Error in {self.name} agent: {str(e)}")
            raise 