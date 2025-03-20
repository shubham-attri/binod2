import os
from typing import Dict, Any, Optional, List
from loguru import logger
from litellm import completion
import litellm

# Configure LiteLLM
litellm.set_verbose = False

# Default model to use if none specified
DEFAULT_MODEL = "gpt-3.5-turbo-16k"

# Set the OpenAI API Key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
    litellm.api_key = OPENAI_API_KEY
else:
    logger.warning("OPENAI_API_KEY not found in environment")

# You can add custom provider configs here
PROVIDER_CONFIGS = {
    # Example: "anthropic": {"api_key": os.getenv("ANTHROPIC_API_KEY")}
}

# Set provider configurations
for provider, config in PROVIDER_CONFIGS.items():
    if config.get("api_key"):
        litellm.api_keys[provider] = config["api_key"]

class LLMProxy:
    """Proxy for LLM completions using LiteLLM"""
    
    def __init__(self):
        """Initialize the LLM proxy"""
        self.default_model = DEFAULT_MODEL
        logger.info(f"LLM proxy initialized with default model: {self.default_model}")
        
    async def generate_completion(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        stop: Optional[List[str]] = None,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a completion using LiteLLM
        
        Args:
            prompt: The input prompt
            model: The model to use (falls back to default)
            temperature: Temperature for sampling
            max_tokens: Maximum tokens to generate
            stop: List of stop sequences
            stream: Whether to stream the response
            **kwargs: Additional arguments for the completion API
            
        Returns:
            Dict[str, Any]: The completion response
        """
        try:
            # Use the provided model or fall back to default
            selected_model = model or self.default_model
            
            # Generate completion
            response = await completion(
                model=selected_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                stop=stop,
                stream=stream,
                **kwargs
            )
            
            return response
        except Exception as e:
            logger.error(f"Error generating completion: {e}")
            raise
            
    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        stop: Optional[List[str]] = None,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a chat completion using LiteLLM
        
        Args:
            messages: List of message objects with role and content
            model: The model to use (falls back to default)
            temperature: Temperature for sampling
            max_tokens: Maximum tokens to generate
            stop: List of stop sequences
            stream: Whether to stream the response
            **kwargs: Additional arguments for the completion API
            
        Returns:
            Dict[str, Any]: The completion response
        """
        try:
            # Use the provided model or fall back to default
            selected_model = model or self.default_model
            
            # Generate completion
            response = await completion(
                model=selected_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stop=stop,
                stream=stream,
                **kwargs
            )
            
            return response
        except Exception as e:
            logger.error(f"Error generating chat completion: {e}")
            raise
    
    def get_available_models(self) -> List[str]:
        """Get a list of available models"""
        try:
            # This is a simplified version; in a real implementation, 
            # you might query different providers for their available models
            return [
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-16k",
                "gpt-4",
                "gpt-4-turbo"
            ]
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return [self.default_model]

# Create a singleton instance
llm_proxy = LLMProxy() 