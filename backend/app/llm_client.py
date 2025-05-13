"""
LLM Client for OpenRouter integration.
This module provides functionality to interact with OpenRouter's LLM API.
"""

import os
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class OpenRouterLLM:
    """Client for interacting with OpenRouter's LLM API."""
    
    def __init__(self):
        """Initialize the OpenRouter LLM client."""
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            logger.error("OPENROUTER_API_KEY not found in environment variables")
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")
        
        self.model = os.getenv("OPENROUTER_MODEL", "microsoft/mai-ds-r1:free")
        self.api_base = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),  # Required for OpenRouter
            "X-Title": os.getenv("APP_NAME", "Binod AI Assistant")  # Optional but recommended
        }
        logger.info(f"OpenRouterLLM initialized with model: {self.model}")
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_response(self, 
                               messages: List[Dict[str, str]], 
                               temperature: float = 0.7,
                               max_tokens: int = 1000,
                               stream: bool = False,
                               context: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a response from the LLM.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            temperature: Controls randomness (0-1)
            max_tokens: Maximum number of tokens to generate
            stream: Whether to stream the response
            context: Optional context to include (e.g., from vector search)
            
        Returns:
            Dictionary containing the response
        """
        # Prepare system message with context if provided
        if context:
            system_message = {
                "role": "system",
                "content": f"You are a helpful AI assistant. Use the following context to help answer the user's question: {context}"
            }
            # Add system message at the beginning if not already present
            if not messages or messages[0].get("role") != "system":
                messages = [system_message] + messages
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        logger.info(f"Sending request to OpenRouter with {len(messages)} messages")
        
        try:
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            logger.info("Successfully received response from OpenRouter")
            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling OpenRouter API: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            raise
    
    def extract_response_content(self, response: Dict[str, Any]) -> str:
        """Extract the content from the LLM response."""
        try:
            return response["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            logger.error(f"Error extracting content from response: {str(e)}")
            logger.error(f"Response structure: {json.dumps(response, indent=2)}")
            return "I apologize, but I encountered an error processing your request."
    
    def format_messages(self, history: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Format chat history into the structure expected by OpenRouter.
        
        Args:
            history: List of message dictionaries from the chat history
            
        Returns:
            List of formatted message dictionaries
        """
        formatted_messages = []
        
        # Add a system message if not present
        if not history or history[0].get("role") != "system":
            formatted_messages.append({
                "role": "system",
                "content": "You are a helpful AI assistant that provides accurate and concise information."
            })
        
        # Format the rest of the messages
        for message in history:
            if "role" in message and "content" in message:
                formatted_messages.append({
                    "role": message["role"],
                    "content": message["content"]
                })
        
        return formatted_messages

# Create a singleton instance
llm_client = OpenRouterLLM()
