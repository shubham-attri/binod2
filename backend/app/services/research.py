from typing import List, Dict, Any
from ..models.base import Message
from ..core.config import get_settings
from langchain_anthropic import AnthropicLLM
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

settings = get_settings()

class ResearchService:
    def __init__(self):
        self.llm = AnthropicLLM(
            model="claude-2.1",
            temperature=0.7,
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            max_tokens=4096
        )
        
        self.system_prompt = """You are a highly knowledgeable legal AI assistant. Your role is to:
1. Provide accurate legal research and analysis
2. Help with legal document drafting and review
3. Offer case law citations and references
4. Explain complex legal concepts clearly
5. Maintain strict confidentiality and professional ethics

Always cite relevant cases, statutes, or regulations when applicable.
When providing legal analysis, structure your responses clearly with headings and bullet points where appropriate.
Include relevant jurisdiction-specific information when possible."""

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "{input}")
        ])
        
        self.chain = self.prompt | self.llm | StrOutputParser()

    async def process_message(self, messages: List[Message]) -> Dict[str, Any]:
        # Get the last user message
        last_message = next((msg for msg in reversed(messages) if msg.role == "user"), None)
        if not last_message:
            raise ValueError("No user message found")
        
        # Get response from LLM
        response = await self.chain.ainvoke({"input": last_message.content})
        
        return {
            "role": "assistant",
            "content": response,
            "metadata": {
                "model": "claude-2.1"
            }
        }

research_service = ResearchService() 