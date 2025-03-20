"""Utility functions and services for the backend"""

# Import singletons for easier access
from .redis_client import redis_client
from .tracing import tracer
from .websocket_manager import connection_manager
from .autocomplete import autocomplete_service
from .llm_proxy import llm_proxy 