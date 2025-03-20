from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
from .models import ChatMessage, DocumentRequest, DocumentUpdateRequest, RAGQueryRequest, VectorSearchRequest
import asyncio
import os
import logging
from loguru import logger
import time
from typing import Dict, Any, List, Optional

# Import components
from .utils.websocket_manager import connection_manager
from .agents.chat_agent import chat_agent
from .rag.vector_store_redisvl import vector_store  # Use RedisVL instead of previous vector_store
from .document.generator import generate_document, update_document, get_document, get_document_versions, get_available_templates
from .utils.autocomplete import autocomplete_service
from .utils.tracing import tracer
from .utils.llm_proxy import llm_proxy

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("DEV_SERVER_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "services": {
        "redis": "up" if vector_store.index is not None else "down",
        "llm": "up" if llm_proxy is not None else "down"
    }}

async def stream_agent_steps(message: ChatMessage):
    """Stream the agent's thinking process and final response"""
    try:
        # Get session ID (use message content hash as fallback)
        session_id = str(hash(message.content))
        
        # Create a trace for this request
        trace_id = tracer.create_trace(
            name="chat_request",
            user_id=session_id,
            metadata={
                "content": message.content,
                "file_url": message.file_Url,
                "quote": message.quote
            }
        )
        
        # Generate thinking steps using the chat agent
        thinking_steps = await chat_agent.generate_thinking_steps(message.content)
        
        # Stream thinking steps
        for step in thinking_steps:
            yield json.dumps({
                "type": "thinking_step",
                "content": step.get("step"),
                "reasoning": step.get("reasoning", "")
            }) + "\n"
            await asyncio.sleep(0.3)  # Simulate processing time
        
        # Generate response
        response, _ = await chat_agent.generate_response(
            message=message.content,
            session_id=session_id,
            file_url=message.file_Url,
            quote=message.quote
        )

        # Stream final response
        yield json.dumps({
            "type": "response",
            "content": response,
            "thinking_steps": [step.get("step") for step in thinking_steps]
        }) + "\n"
        
        # Log completion
        tracer.log_event(
            trace_id=trace_id,
            name="response_completed",
            metadata={"response_length": len(response)}
        )

    except Exception as e:
        logger.error(f"Error in stream_agent_steps: {e}")
        yield json.dumps({
            "type": "error",
            "content": str(e)
        }) + "\n"

@app.post("/chat")
async def chat(message: ChatMessage):
    """Legacy HTTP endpoint for chat (for backward compatibility)"""
    logger.info("--------------------------------")
    logger.info("Received message:")
    logger.info(f"Content: {message.content}")
    logger.info(f"File URL: {message.file_Url}")
    logger.info(f"Quote: {message.quote}")
    logger.info("--------------------------------")

    if not message.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    return StreamingResponse(
        stream_agent_steps(message),
        media_type="text/event-stream"
    )

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for chat interactions"""
    # Accept connection
    session_id = await connection_manager.connect(websocket)
    
    try:
        # Send welcome message
        await connection_manager.send_message(
            session_id,
            {
                "type": "system_message",
                "content": "Connected to Agent Binod chat server",
                "session_id": session_id
            }
        )
        
        # Handle messages
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            # Get message type
            message_type = data.get("type", "user_message")
            
            # Handle message based on type
            if message_type == "user_message":
                # Extract message content
                content = data.get("payload", {}).get("content", "")
                file_url = data.get("payload", {}).get("file_url")
                quote = data.get("payload", {}).get("quote")
                
                if not content.strip():
                    await connection_manager.send_message(
                        session_id,
                        {
                            "type": "error",
                            "content": "Message cannot be empty",
                            "session_id": session_id
                        }
                    )
                    continue
                
                # Acknowledge receipt
                await connection_manager.send_message(
                    session_id,
                    {
                        "type": "message_received",
                        "content": "Processing your message...",
                        "session_id": session_id
                    }
                )
                
                # Process the message asynchronously
                asyncio.create_task(process_chat_message(
                    session_id=session_id,
                    content=content,
                    file_url=file_url,
                    quote=quote
                ))
                
            elif message_type == "feedback":
                # Handle feedback
                score = data.get("payload", {}).get("score", 0)
                trace_id = data.get("payload", {}).get("trace_id")
                comment = data.get("payload", {}).get("comment")
                
                if trace_id:
                    tracer.log_feedback(
                        trace_id=trace_id,
                        score=float(score),
                        comment=comment
                    )
                    
                    await connection_manager.send_message(
                        session_id,
                        {
                            "type": "feedback_received",
                            "content": "Thank you for your feedback!",
                            "session_id": session_id
                        }
                    )
            
            elif message_type == "ping":
                # Respond to ping
                await connection_manager.send_message(
                    session_id,
                    {
                        "type": "pong",
                        "session_id": session_id
                    }
                )
                
    except WebSocketDisconnect:
        # Handle disconnection
        connection_manager.disconnect(session_id)
    except Exception as e:
        # Handle errors
        logger.error(f"WebSocket error: {e}")
        try:
            await connection_manager.send_message(
                session_id,
                {
                    "type": "error",
                    "content": f"An error occurred: {str(e)}",
                    "session_id": session_id
                }
            )
        except:
            pass
        connection_manager.disconnect(session_id)

async def process_chat_message(session_id: str, content: str, file_url: Optional[str] = None, quote: Optional[str] = None):
    """Process a chat message and send the response via WebSocket"""
    try:
        # Create a trace for this request
        trace_id = tracer.create_trace(
            name="chat_request",
            user_id=session_id,
            metadata={
                "content": content,
                "file_url": file_url,
                "quote": quote
            }
        )
        
        # Generate thinking steps
        thinking_steps = await chat_agent.generate_thinking_steps(content)
        
        # Send thinking steps
        for step in thinking_steps:
            await connection_manager.send_message(
                session_id,
                {
                    "type": "thinking_step",
                    "content": step.get("step"),
                    "reasoning": step.get("reasoning", ""),
                    "session_id": session_id,
                    "trace_id": trace_id
                }
            )
            await asyncio.sleep(0.3)  # Simulate processing time
            
        # Generate response
        response, _ = await chat_agent.generate_response(
            message=content,
            session_id=session_id,
            file_url=file_url,
            quote=quote
        )
        
        # Send response
        await connection_manager.send_message(
            session_id,
            {
                "type": "ai_response",
                "content": response,
                "thinking_steps": [step.get("step") for step in thinking_steps],
                "session_id": session_id,
                "trace_id": trace_id
            }
        )
        
        # Log completion
        tracer.log_event(
            trace_id=trace_id,
            name="response_completed",
            metadata={"response_length": len(response)}
        )
            
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        await connection_manager.send_message(
            session_id,
            {
                "type": "error",
                "content": f"An error occurred: {str(e)}",
                "session_id": session_id
            }
        )

@app.websocket("/ws/editor")
async def websocket_editor(websocket: WebSocket):
    """WebSocket endpoint for editor interactions"""
    # Accept connection
    session_id = await connection_manager.connect(websocket)
    
    try:
        # Send welcome message
        await connection_manager.send_message(
            session_id,
            {
                "type": "system_message",
                "content": "Connected to Agent Binod editor server",
                "session_id": session_id
            }
        )
        
        # Handle messages
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            # Get message type
            message_type = data.get("type", "editor_context")
            
            # Handle message based on type
            if message_type == "editor_context":
                # Editor context update (user is typing or context changed)
                context = data.get("payload", {}).get("content", "")
                cursor_position = data.get("payload", {}).get("cursor_position", 0)
                
                # Process editor context
                asyncio.create_task(process_editor_context(
                    session_id=session_id,
                    context=context,
                    cursor_position=cursor_position
                ))
                
            elif message_type == "autocomplete_request":
                # Explicit autocomplete request
                prefix = data.get("payload", {}).get("prefix", "")
                context = data.get("payload", {}).get("context", "")
                category = data.get("payload", {}).get("category", "legal")
                
                # Process autocomplete request
                asyncio.create_task(process_autocomplete_request(
                    session_id=session_id,
                    prefix=prefix,
                    context=context,
                    category=category
                ))
                
            elif message_type == "suggestion_feedback":
                # Feedback on a suggestion (accepted or rejected)
                suggestion_id = data.get("payload", {}).get("suggestion_id")
                accepted = data.get("payload", {}).get("accepted", False)
                
                # Log feedback
                suggestion_trace_id = data.get("payload", {}).get("trace_id")
                if suggestion_trace_id:
                    tracer.log_feedback(
                        trace_id=suggestion_trace_id,
                        score=1.0 if accepted else -1.0,
                        feedback_type="suggestion_feedback",
                        comment=f"Suggestion {'accepted' if accepted else 'rejected'}"
                    )
                
                # Send acknowledgment
                await connection_manager.send_message(
                    session_id,
                    {
                        "type": "feedback_received",
                        "content": "Suggestion feedback received",
                        "session_id": session_id
                    }
                )
                
            elif message_type == "ping":
                # Respond to ping
                await connection_manager.send_message(
                    session_id,
                    {
                        "type": "pong",
                        "session_id": session_id
                    }
                )
                
    except WebSocketDisconnect:
        # Handle disconnection
        connection_manager.disconnect(session_id)
    except Exception as e:
        # Handle errors
        logger.error(f"WebSocket error: {e}")
        try:
            await connection_manager.send_message(
                session_id,
                {
                    "type": "error",
                    "content": f"An error occurred: {str(e)}",
                    "session_id": session_id
                }
            )
        except:
            pass
        connection_manager.disconnect(session_id)

async def process_editor_context(session_id: str, context: str, cursor_position: int):
    """Process editor context and send suggestions via WebSocket"""
    try:
        # Extract the current line or paragraph around the cursor
        lines = context.split("\n")
        current_line = ""
        
        # Find the line containing the cursor
        pos = 0
        for line in lines:
            if pos <= cursor_position < pos + len(line) + 1:
                current_line = line
                break
            pos += len(line) + 1
        
        # If we found a line, get suggestions
        if current_line:
            # Extract the prefix (text before cursor on current line)
            cursor_line_pos = cursor_position - pos
            prefix = current_line[:cursor_line_pos].strip()
            
            # Check if we should generate suggestions
            if len(prefix) >= 3:
                # Get suggestions
                suggestions = autocomplete_service.get_suggestions(
                    partial_text=prefix,
                    category="legal",
                    max_results=5
                )
                
                # If we have suggestions, send them
                if suggestions:
                    # Create a trace
                    trace_id = tracer.create_trace(
                        name="autocomplete_suggestions",
                        user_id=session_id,
                        metadata={"prefix": prefix, "cursor_position": cursor_position}
                    )
                    
                    # Send suggestions
                    await connection_manager.send_message(
                        session_id,
                        {
                            "type": "suggestion",
                            "payload": {
                                "suggestions": suggestions,
                                "prefix": prefix,
                                "cursor_position": cursor_position,
                                "line_position": cursor_line_pos,
                                "trace_id": trace_id
                            },
                            "session_id": session_id
                        }
                    )
    except Exception as e:
        logger.error(f"Error processing editor context: {e}")

async def process_autocomplete_request(session_id: str, prefix: str, context: str, category: str = "legal"):
    """Process explicit autocomplete request and send suggestions via WebSocket"""
    try:
        # Create a trace
        trace_id = tracer.create_trace(
            name="explicit_autocomplete",
            user_id=session_id,
            metadata={"prefix": prefix, "category": category}
        )
        
        # Get suggestions
        suggestions = autocomplete_service.get_suggestions(
            partial_text=prefix,
            category=category,
            max_results=10,
            use_semantic=True
        )
        
        # Send suggestions
        await connection_manager.send_message(
            session_id,
            {
                "type": "suggestion",
                "payload": {
                    "suggestions": suggestions,
                    "prefix": prefix,
                    "trace_id": trace_id
                },
                "session_id": session_id
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing autocomplete request: {e}")
        await connection_manager.send_message(
            session_id,
            {
                "type": "error",
                "content": f"Error generating suggestions: {str(e)}",
                "session_id": session_id
            }
        )

# Document generation endpoints
@app.post("/document/generate")
async def create_document(request: DocumentRequest):
    """Generate a document from a template and variables"""
    try:
        doc_id, content = generate_document(request.template, request.variables)
        return {"doc_id": doc_id, "content": content}
    except Exception as e:
        logger.error(f"Error generating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/document/{doc_id}")
async def update_doc(doc_id: str, request: DocumentUpdateRequest):
    """Update an existing document with new variables"""
    try:
        doc_id, content, diff = update_document(doc_id, request.variables)
        return {"doc_id": doc_id, "content": content, "diff": diff}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/document/{doc_id}")
async def get_doc(doc_id: str, version: Optional[int] = None):
    """Get a document by ID, optionally a specific version"""
    try:
        doc_data = get_document(doc_id, version)
        return doc_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/document/{doc_id}/versions")
async def get_doc_versions(doc_id: str):
    """Get all available versions of a document"""
    try:
        versions = get_document_versions(doc_id)
        return {"versions": versions}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting document versions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/document/templates")
async def list_templates():
    """Get available document templates"""
    return {"templates": get_available_templates()}

# RAG endpoints
@app.post("/rag/query")
async def rag_query(request: RAGQueryRequest):
    """Query the vector store for relevant documents"""
    try:
        results = vector_store.similarity_search(
            query=request.query, 
            k=request.top_k
        )
        return {
            "results": [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata
                } 
                for doc in results
            ]
        }
    except Exception as e:
        logger.error(f"Error querying vector store: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/search")
async def vector_search(request: VectorSearchRequest):
    """Semantic search in the vector store"""
    try:
        results = vector_store.similarity_search_with_score(
            query=request.text,
            k=request.top_k,
            namespace=request.namespace
        )
        return {
            "results": [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": score
                }
                for doc, score in results
            ]
        }
    except Exception as e:
        logger.error(f"Error searching vector store: {e}")
        raise HTTPException(status_code=500, detail=str(e))