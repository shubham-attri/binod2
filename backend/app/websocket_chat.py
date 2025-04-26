from fastapi import WebSocket, WebSocketDisconnect
from redisvl.extensions.session_manager import SemanticSessionManager
from redis import Redis

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
            thread_id = str(uuid.uuid4())
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
            print(f"Error getting chat history: {e}")
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
            print(f"Error storing message: {e}")

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
            
            if not content:
                continue

            # Store user message
            await chat_manager.store_message(thread_id, "user", content)
            logger.info(f"Thread {thread_id}: Stored user message: {content}")
            
            # Simulate thinking steps
            thinking_steps = [
                "Analyzing your message...",
                "Processing the request...",
                "Generating response..."
            ]
            
            for step in thinking_steps:
                await chat_manager.send_thinking_step(websocket, step)
                logger.info(f"Thread {thread_id}: Sent thinking step: {step}")
                await asyncio.sleep(0.5)  # Simulate processing time
            
            # Generate dummy response
            response = f"This is a dummy response to: {content}"
            logger.info(f"Thread {thread_id}: Generated response: {response}")
            
            # Store assistant response
            await chat_manager.store_message(thread_id, "assistant", response)
            logger.info(f"Thread {thread_id}: Stored assistant response")
            
            # Send final response
            await chat_manager.send_response(websocket, response, thinking_steps)
            logger.info(f"Thread {thread_id}: Sent final response")
            
    except WebSocketDisconnect:
        chat_manager.disconnect(thread_id)
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "content": str(e)
        }) 