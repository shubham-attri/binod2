from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from .websocket_chat import chat_endpoint, chat_manager
from .vector_indexer import indexer
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

@app.post("/ingest")
async def ingest_documents(request: Request):
    """Ingest text into Redis vector index for a project."""
    data = await request.json()
    project_id = data.get("project_id")
    text = data.get("text")
    if not project_id or not text:
        raise HTTPException(status_code=400, detail="project_id and text are required")
    logger.info(f"Received ingestion request: project_id={project_id}, text_length={len(text)}")
    count = indexer.ingest(project_id, text)
    logger.info(f"Indexed {count} chunks for project_id={project_id}")
    return {"ingested_chunks": count}