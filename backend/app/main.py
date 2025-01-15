from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
from .models import ChatMessage
import asyncio

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def generate_thinking_steps():
    steps = [
        "Analyzing the query...",
        "Processing information...",
        "Formulating response...",
    ]
    for step in steps:
        yield json.dumps({"type": "thinking_step", "content": step}) + "\n"
        await asyncio.sleep(0.5)  # Simulate processing time

async def generate_response(message: str):
    # Generate thinking steps first
    async for step in generate_thinking_steps():
        yield step
    
    # Then send the final response
    response = f"This is a simulated response to: '{message}'"
    yield json.dumps({
        "type": "response",
        "content": response,
        "thinking_steps": [
            "Analyzed the query",
            "Processed information",
            "Formulated response"
        ]
    }) + "\n"

@app.post("/chat")
async def chat(message: ChatMessage):
    if not message.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    return StreamingResponse(
        generate_response(message.content),
        media_type="text/event-stream"
    ) 