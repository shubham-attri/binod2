from typing import Any, Dict, Optional, List
from langchain.agents import AgentExecutor, Tool
from langchain.memory import ConversationBufferMemory
from app.services.ai_engine.base import AIEngine

class BaseAgent:
    """Base class for all agents"""
    
    def __init__(
        self,
        engine: AIEngine,
        tools: List[Tool],
        system_prompt: str,
        memory: Optional[ConversationBufferMemory] = None
    ):
        self.engine = engine
        self.tools = tools
        self.system_prompt = system_prompt
        self.memory = memory or ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.executor = None  # Will be initialized in setup()
    
    async def setup(self):
        """Set up the agent with tools and memory"""
        # This will be implemented by specific agent types
        # (e.g., OpenAI Functions, ReAct, etc.)
        raise NotImplementedError("Subclasses must implement setup")
    
    async def run(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Run the agent"""
        if not self.executor:
            await self.setup()
            
        # Prepare input with context
        if context:
            input_text = f"Context: {context}\n\nQuery: {input_text}"
            
        # Run agent
        response = await self.executor.arun(input_text)
        return response
    
    def add_tool(self, tool: Tool):
        """Add a new tool to the agent"""
        self.tools.append(tool)
        # Reset executor to rebuild with new tool
        self.executor = None
    
    def clear_memory(self):
        """Clear the agent's memory"""
        if self.memory:
            self.memory.clear() 