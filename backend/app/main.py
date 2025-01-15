from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from .models import ChatRequest, ChatResponse
import asyncio

app = FastAPI()

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    # Simulate thinking steps and response
    thinking_steps = [
        "Analyzing query context...",
        "Retrieving relevant information...",
        "Formulating response..."
    ]
    
    # Simulate processing time
    await asyncio.sleep(2)
    
    return ChatResponse(
        content=f"This is a simulated response to: '{request.message}'",
        thinking_steps=thinking_steps
    ) 