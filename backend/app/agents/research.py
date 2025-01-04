from typing import List
from langchain_core.messages import SystemMessage, HumanMessage
from .base import BaseAgent

class ResearchAgent(BaseAgent):
    """Agent for handling research mode queries"""
    
    def __init__(self):
        super().__init__(
            name="Research Agent",
            description="Handles legal research queries and document analysis"
        )
    
    async def process_query(self, query: str) -> dict:
        """Process a research query"""
        messages = [
            SystemMessage(content="""You are a legal research assistant. 
            Analyze queries thoroughly and provide well-structured responses 
            with relevant legal citations."""),
            HumanMessage(content=query)
        ]
        
        return await self.process(messages, mode="research") 