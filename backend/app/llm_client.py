"""
LLM Client for OpenRouter integration with LangChain.

This module provides a LangChain-compatible client for OpenRouter's API,
enabling seamless integration with the LangChain ecosystem and features
like semantic caching.
"""

import os
import logging
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv

# LangChain imports
from langchain_core.utils.utils import secret_from_env
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_community.cache import RedisSemanticCache
from langchain.globals import set_llm_cache
from pydantic import Field, SecretStr
from .shared_resources import *


# Configure logging
logger = logging.getLogger(__name__)


class ChatOpenRouter(ChatOpenAI):
    """LangChain compatible OpenRouter chat model.
    
    This class extends ChatOpenAI to work with OpenRouter, allowing seamless
    integration with LangChain's ecosystem while using OpenRouter's API.
    """
    
    openai_api_key: Optional[SecretStr] = Field(
        alias="api_key", default_factory=secret_from_env("OPENROUTER_API_KEY", default=None)
    )
    
    @property
    def lc_secrets(self) -> dict[str, str]:
        return {"openai_api_key": "OPENROUTER_API_KEY"}

    def __init__(self,
                 openai_api_key: Optional[str] = None,
                 model_name: str = "microsoft/mai-ds-r1:free",
                 **kwargs):
        openai_api_key = openai_api_key or os.environ.get("OPENROUTER_API_KEY")
        
        # Set default HTTP headers for OpenRouter
        http_headers = kwargs.pop('http_headers', {}) 
        http_headers.update({
            "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
            "X-Title": os.getenv("APP_NAME", "Binod AI Assistant")
        })
        
        # Initialize with OpenRouter base URL
        super().__init__(
            base_url="https://openrouter.ai/api/v1", 
            openai_api_key=openai_api_key,
            model_name=model_name,
            http_headers=http_headers,
            **kwargs
        )
        
        logger.info(f"ChatOpenRouter initialized with model: {model_name}")

# Set up semantic caching with Redis
try:
    # Initialize semantic cache
    semantic_cache = RedisSemanticCache(
        redis_client=redis_client,
        embedding_key="cache:embeddings",  # Redis key prefix for embeddings
        ttl=3600  # Cache entries expire after 1 hour
    )
    
    # Set the LLM cache globally for LangChain
    set_llm_cache(semantic_cache)
    logger.info("LangChain semantic cache initialized with Redis")
except Exception as e:
    logger.warning(f"Failed to initialize semantic cache: {e}")
    logger.warning("Continuing without semantic caching")

# Create LangChain compatible instance
default_model = os.getenv("OPENROUTER_MODEL", "microsoft/mai-ds-r1:free")
if not default_model:
    logger.warning("OPENROUTER_MODEL not set, using default model")

# This is the main LLM client that should be imported and used throughout the application
llm_client = ChatOpenRouter(model_name=default_model)

# For backward compatibility with existing code
langchain_llm = llm_client
