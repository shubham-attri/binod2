from typing import Optional
from langchain_core.messages import SystemMessage, HumanMessage
from .base import BaseAgent

class CaseAgent(BaseAgent):
    """Agent for handling case-specific queries"""
    
    def __init__(self):
        super().__init__(
            name="Case Agent",
            description="Handles case-specific analysis and document management"
        )
    
    async def process_query(self, query: str, case_id: Optional[str] = None) -> dict:
        """Process a case-specific query"""
        messages = [
            SystemMessage(content="""You are a case analysis assistant.
            Focus on case-specific details and maintain context across interactions."""),
            HumanMessage(content=query)
        ]
        
        return await self.process(messages, mode="case", case_id=case_id) 