from typing import Any, Dict, Optional
from langchain_anthropic import ChatAnthropic
from langchain.callbacks.base import BaseCallbackHandler
from app.core.config import get_settings

settings = get_settings()

class AIEngine:
    """Base AI Engine that handles core functionality"""
    
    def __init__(
        self,
        model_name: str = settings.ANTHROPIC_MODEL,
        temperature: float = 0.7,
        streaming: bool = False,
        callbacks: Optional[list[BaseCallbackHandler]] = None
    ):
        self.model = ChatAnthropic(
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            model=model_name,
            temperature=temperature,
            streaming=streaming,
            callbacks=callbacks
        )
        self.streaming = streaming
        self.callbacks = callbacks or []
    
    async def process_request(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Process a request using the appropriate chain or agent"""
        raise NotImplementedError("Subclasses must implement process_request")
    
    def add_callback(self, callback: BaseCallbackHandler):
        """Add a callback handler"""
        self.callbacks.append(callback)
        if hasattr(self.model, 'callbacks'):
            self.model.callbacks = self.callbacks
    
    def set_streaming(self, streaming: bool):
        """Set streaming mode"""
        self.streaming = streaming
        if hasattr(self.model, 'streaming'):
            self.model.streaming = streaming 