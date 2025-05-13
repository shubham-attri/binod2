from fastapi import WebSocket, WebSocketDisconnect
from redisvl.extensions.session_manager import SemanticSessionManager
from redis import Redis
from .agent_system import process_agent_message, create_conversation_thread

import json
import uuid
from datetime import datetime
import asyncio
import logging

logger = logging.getLogger(__name__)

# Initialize Redis client
redis_client = Redis(
    host='redis',  # Docker service name
    port=6379,
    decode_responses=True
)

class ChatManager:
    def __init__(self):
        logger.info("ChatManager initialized")
        self.active_connections: dict = {}
        self.session_manager = SemanticSessionManager(
            name='binod_chat',
            redis_client=redis_client
        )
        
    async def connect(self, websocket: WebSocket, thread_id: str = None):
        logger.info("Accepting WebSocket connection")
        await websocket.accept()
        if not thread_id:
            thread_id = create_conversation_thread()
        logger.info(f"Thread {thread_id}: Connection established")
        self.active_connections[thread_id] = websocket
        return thread_id
        
    def disconnect(self, thread_id: str):
        if thread_id in self.active_connections:
            del self.active_connections[thread_id]

    async def send_thinking_step(self, websocket: WebSocket, step: str):
        await websocket.send_json({
            "type": "thinking_step",
            "content": step
        })

    async def send_response(self, websocket: WebSocket, content: str, thinking_steps: list[str]):
        await websocket.send_json({
            "type": "response",
            "content": content,
            "thinking_steps": thinking_steps
        })

    async def get_chat_history(self, thread_id: str):
        try:
            # Get recent messages for the thread
            messages = self.session_manager.get_recent(top_k=10)
            return messages
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []

    async def store_message(self, thread_id: str, role: str, content: str):
        try:
            self.session_manager.add_message({
                "role": role,
                "content": content,
                "thread_id": thread_id,
                "timestamp": datetime.utcnow().isoformat()
            })
        except Exception as e:
            logger.error(f"Error storing message: {e}")

chat_manager = ChatManager()

async def chat_endpoint(websocket: WebSocket, thread_id: str = None):
    thread_id = await chat_manager.connect(websocket, thread_id)
    logger.info(f"WebSocket opened for thread {thread_id}")
    
    try:
        # Send chat history if thread exists
        history = await chat_manager.get_chat_history(thread_id)
        logger.info(f"Thread {thread_id}: Retrieved history count = {len(history)}")
        if history:
            await websocket.send_json({
                "type": "history",
                "messages": history
            })
        
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            logger.info(f"Thread {thread_id}: Received message: {data.get('content','')}")
            content = data.get("content", "").strip()
            file_url = data.get("fileUrl", "")
            quote = data.get("quote", "")
            
            # Debug log the entire message data
            logger.info(f"Thread {thread_id}: Full message data: {data}")
            
            if not content:
                continue
                
            # Log if quote is present
            if quote:
                logger.info(f"Thread {thread_id}: Received quote: {quote[:50]}...")
            
            # Store user message
            await chat_manager.store_message(thread_id, "user", content)
            logger.info(f"Thread {thread_id}: Stored user message: {content}")
            
            # Initial thinking steps - will be updated by agent
            thinking_steps = [
                "Processing your message...",
                "Searching for relevant information...",
                "Generating response..."
            ]
            
            # Show initial thinking steps
            for step in thinking_steps:
                await chat_manager.send_thinking_step(websocket, step)
                logger.info(f"Thread {thread_id}: Sent thinking step: {step}")
                await asyncio.sleep(0.3)  # Short delay for UX
            
            # Process message through LangGraph agent
            response, updated_thinking_steps = await process_agent_message(thread_id, content, quote)
            
            # Update thinking steps if provided
            if updated_thinking_steps and len(updated_thinking_steps) > 0:
                thinking_steps = updated_thinking_steps
                logger.info(f"Thread {thread_id}: Updated thinking steps from agent")
            
            # Store assistant response
            await chat_manager.store_message(thread_id, "assistant", response)
            logger.info(f"Thread {thread_id}: Stored assistant response")
            
            # Send final response
            await chat_manager.send_response(websocket, response, thinking_steps)
            logger.info(f"Thread {thread_id}: Sent final response")
            
    except WebSocketDisconnect:
        chat_manager.disconnect(thread_id)
        logger.info(f"Thread {thread_id}: WebSocket disconnected")
    except Exception as e:
        logger.error(f"Thread {thread_id}: Error in chat endpoint: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": str(e)
            })
        except:
            logger.error(f"Thread {thread_id}: Could not send error message to client") 