import asyncio
import json
from typing import Dict, Set, Any, Optional, Callable, Awaitable
from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger
import uuid

class ConnectionManager:
    """WebSocket connection manager for handling client connections"""
    
    def __init__(self):
        """Initialize the connection manager"""
        # Maps session_id to WebSocket instance
        self.active_connections: Dict[str, WebSocket] = {}
        # Maps channel to set of session_ids
        self.channel_subscribers: Dict[str, Set[str]] = {}
        # Maps session_id to user_id for authentication
        self.session_users: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, session_id: Optional[str] = None) -> str:
        """
        Connect a WebSocket client
        
        Args:
            websocket: The WebSocket connection
            session_id: Optional session ID (generated if not provided)
            
        Returns:
            str: The session ID
        """
        await websocket.accept()
        
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Store the connection
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected: {session_id}")
        
        return session_id
    
    def disconnect(self, session_id: str):
        """
        Disconnect a WebSocket client
        
        Args:
            session_id: The session ID to disconnect
        """
        # Remove from active connections
        if session_id in self.active_connections:
            self.active_connections.pop(session_id)
            logger.info(f"WebSocket disconnected: {session_id}")
        
        # Remove from channel subscriptions
        for channel, subscribers in self.channel_subscribers.items():
            if session_id in subscribers:
                subscribers.remove(session_id)
        
        # Remove from session users
        if session_id in self.session_users:
            self.session_users.pop(session_id)
    
    async def send_message(self, session_id: str, message: Dict[str, Any]):
        """
        Send a message to a specific session
        
        Args:
            session_id: The session ID to send to
            message: The message to send
        """
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            try:
                await websocket.send_json(message)
                logger.debug(f"Sent message to session {session_id}: {message.get('type')}")
            except Exception as e:
                logger.error(f"Error sending message to session {session_id}: {e}")
                # Disconnect on error
                self.disconnect(session_id)
    
    async def broadcast(self, message: Dict[str, Any], exclude: Optional[str] = None):
        """
        Broadcast a message to all connected clients
        
        Args:
            message: The message to broadcast
            exclude: Optional session ID to exclude from broadcast
        """
        for session_id, websocket in self.active_connections.items():
            if exclude and session_id == exclude:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to session {session_id}: {e}")
                # Don't disconnect here to avoid modifying dict during iteration
    
    def subscribe(self, session_id: str, channel: str):
        """
        Subscribe a session to a channel
        
        Args:
            session_id: The session ID to subscribe
            channel: The channel to subscribe to
        """
        if channel not in self.channel_subscribers:
            self.channel_subscribers[channel] = set()
        
        self.channel_subscribers[channel].add(session_id)
        logger.info(f"Session {session_id} subscribed to channel {channel}")
    
    def unsubscribe(self, session_id: str, channel: str):
        """
        Unsubscribe a session from a channel
        
        Args:
            session_id: The session ID to unsubscribe
            channel: The channel to unsubscribe from
        """
        if channel in self.channel_subscribers and session_id in self.channel_subscribers[channel]:
            self.channel_subscribers[channel].remove(session_id)
            logger.info(f"Session {session_id} unsubscribed from channel {channel}")
    
    async def publish_to_channel(self, channel: str, message: Dict[str, Any], exclude: Optional[str] = None):
        """
        Publish a message to a channel
        
        Args:
            channel: The channel to publish to
            message: The message to publish
            exclude: Optional session ID to exclude from publication
        """
        if channel not in self.channel_subscribers:
            logger.warning(f"No subscribers for channel {channel}")
            return
        
        for session_id in self.channel_subscribers[channel]:
            if exclude and session_id == exclude:
                continue
            
            await self.send_message(session_id, message)
    
    def authenticate_session(self, session_id: str, user_id: str):
        """
        Authenticate a session with a user ID
        
        Args:
            session_id: The session ID to authenticate
            user_id: The user ID to associate with the session
        """
        self.session_users[session_id] = user_id
        logger.info(f"Session {session_id} authenticated as user {user_id}")
    
    def get_user_id(self, session_id: str) -> Optional[str]:
        """
        Get the user ID associated with a session
        
        Args:
            session_id: The session ID to check
            
        Returns:
            Optional[str]: The user ID or None if not authenticated
        """
        return self.session_users.get(session_id)
    
    def is_authenticated(self, session_id: str) -> bool:
        """
        Check if a session is authenticated
        
        Args:
            session_id: The session ID to check
            
        Returns:
            bool: Whether the session is authenticated
        """
        return session_id in self.session_users

# Create a singleton instance
connection_manager = ConnectionManager()