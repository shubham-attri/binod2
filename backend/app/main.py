from fastapi import FastAPI, HTTPException 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
from .models import ChatMessage
import asyncio
import os 
import logging

# Only For Debugging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("DEV_SERVER_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def stream_agent_steps(message: ChatMessage):
    """Stream the agent's thinking process and final response"""
    try:
        # Example agent steps - replace with your actual agent logic
        agent_steps = [
            "Reading and analyzing input...",
            "Processing document context..." if message.file_Url else None,
            "Analyzing quoted text..." if message.quote else None,
            "Searching relevant information...",
            "Formulating response...",
            "Validating answer..."
        ]

        # Filter out None steps
        agent_steps = [step for step in agent_steps if step]

        # Stream thinking steps
        for step in agent_steps:
            yield json.dumps({
                "type": "thinking_step",
                "content": step
            }) + "\n"
            await asyncio.sleep(0.8)  # Simulate processing time

        # Stream final response
        response_text = f"This is a response to: '{message.content}'"
        if message.quote:
            response_text += f"\nRegarding the quote: '{message.quote}'"
        if message.file_Url:
            response_text += f"\nI've also analyzed the document at: {message.file_Url}"

        yield json.dumps({
            "type": "response",
            "content": response_text,
            "thinking_steps": agent_steps
        }) + "\n"

    except Exception as e:
        logging.error(f"Error in stream_agent_steps: {e}")
        yield json.dumps({
            "type": "error",
            "content": str(e)
        }) + "\n"

@app.post("/chat")
async def chat(message: ChatMessage):
    logging.info("--------------------------------")
    logging.info("Received message:")
    logging.info(f"Content: {message.content}")
    logging.info(f"File URL: {message.file_Url}")
    logging.info(f"Quote: {message.quote}")
    logging.info("--------------------------------")

    if not message.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    return StreamingResponse(
        stream_agent_steps(message),
        media_type="text/event-stream"
    ) 