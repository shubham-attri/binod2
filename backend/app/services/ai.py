from typing import AsyncGenerator, Optional, Union
from langchain_anthropic import ChatAnthropic
from langchain.callbacks.base import BaseCallbackHandler
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import get_settings
from app.models.auth import User
import json
import asyncio

settings = get_settings()

# Initialize Anthropic chat model
chat_model = ChatAnthropic(
    anthropic_api_key=settings.ANTHROPIC_API_KEY,
    model_name=settings.ANTHROPIC_MODEL,
    streaming=True,
    max_tokens=1024
)

async def get_relevant_context(query: str, mode: str = "research") -> str:
    """Get relevant context from Redis vector store"""
    # TODO: Implement vector search when Redis is set up
    return ""

class StreamingCallback(BaseCallbackHandler):
    """Custom callback handler for streaming responses"""
    def __init__(self):
        self.text = ""
        self.queue = asyncio.Queue()

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.text += token
        await self.queue.put(token)

async def get_ai_response(
    message: str,
    user: User,
    mode: str = "research",
    case_id: Optional[str] = None,
    stream: bool = False
) -> Union[AsyncGenerator[str, None], str]:
    """Get AI response with optional streaming"""
    
    # Get relevant context
    context = await get_relevant_context(message, mode)
    
    # Construct the system message
    system_message = (
        "You are Agent Binod, a legal AI assistant. "
        "You provide accurate, well-researched legal information and assistance. "
        "Always cite your sources and explain your reasoning clearly."
    )
    
    if mode == "case":
        system_message += (
            "\nYou are currently assisting with a specific case. "
            "Focus your responses on the case context and requirements."
        )
    
    messages = [
        SystemMessage(content=system_message)
    ]
    
    if context:
        messages.append(SystemMessage(content=f"Relevant context: {context}"))
    
    messages.append(HumanMessage(content=message))
    
    try:
        if stream:
            callback = StreamingCallback()
            chat_model.callbacks = [callback]
            
            # Start the generation in the background
            task = asyncio.create_task(
                chat_model.agenerate(messages=[messages])
            )
            
            async def response_generator():
                while True:
                    try:
                        token = await callback.queue.get()
                        yield token
                        if callback.queue.empty() and task.done():
                            break
                    except asyncio.CancelledError:
                        break
            
            return response_generator()
        else:
            chat_model.streaming = False
            response = await chat_model.agenerate(messages=[messages])
            return response.generations[0][0].text
            
    except Exception as e:
        raise Exception(f"Failed to get AI response: {str(e)}")

async def analyze_document(content: str, metadata: dict) -> dict:
    """Analyze document content and extract relevant information"""
    # TODO: Implement document analysis
    pass