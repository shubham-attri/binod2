from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
from .websocket_chat import chat_endpoint, chat_manager
from fastapi.responses import StreamingResponse
import json
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for new chat"""
    await chat_endpoint(websocket)

@app.websocket("/chat/{thread_id}")
async def websocket_endpoint_with_thread(websocket: WebSocket, thread_id: str):
    """WebSocket endpoint for chat with thread ID"""
    await chat_endpoint(websocket, thread_id)

# @app.post("/api/chat")
# async def chat_http(request: Request):
#     """HTTP endpoint to maintain compatibility with existing frontend"""
#     data = await request.json()
#     content = data.get("content", "").strip()
    
#     async def generate_response():
#         # Send thinking steps
#         thinking_steps = [
#             "Analyzing your message...",
#             "Processing the request...",
#             "Generating response..."
#         ]
        
#         for step in thinking_steps:
#             yield f"data: {json.dumps({'type': 'thinking_step', 'content': step})}\n\n"
#             await asyncio.sleep(0.5)
        
#         # Send final response
#         response = f"This is a dummy response to: {content}"
#         yield f"data: {json.dumps({'type': 'response', 'content': response, 'thinking_steps': thinking_steps})}\n\n"
    
#     return StreamingResponse(
#         generate_response(),
#         media_type="text/event-stream"
#     )