"""
Enhanced Agent System with RAG and Conversation History
"""
from typing import List, Dict, Any, Optional, TypedDict
import logging
from datetime import datetime
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from app.llm_client import llm
from app.vector_indexer import vector_indexer
import uuid
import json

# Configure logging
logger = logging.getLogger(__name__)

# System prompt for the RAG system
SYSTEM_PROMPT = """You are a helpful AI assistant. Use the following context to answer the question.
If you don't know the answer, just say you don't know. Be concise and to the point.

Current conversation:
{history}

Context:
{context}

User's question: {question}"""

# In-memory conversation storage (replace with Redis in production)
conversation_store = {}

class AgentState(TypedDict):
    """State for our agent workflow"""
    messages: List[Dict[str, str]]
    context: str
    thinking_steps: List[str]
    history: str
    thread_id: str

def log_step(state: AgentState, step: str) -> AgentState:
    """Helper function to log thinking steps"""
    step_with_timestamp = f"{datetime.now().strftime('%H:%M:%S')} - {step}"
    state["thinking_steps"].append(step_with_timestamp)
    logger.info(step)
    return state

def get_conversation_history(thread_id: str) -> List[Dict[str, str]]:
    """Get conversation history for a thread"""
    return conversation_store.get(thread_id, [])

def update_conversation_history(thread_id: str, role: str, content: str):
    """Update conversation history for a thread"""
    if thread_id not in conversation_store:
        conversation_store[thread_id] = []
    
    # Keep only the last 20 messages to prevent context window issues
    if len(conversation_store[thread_id]) >= 20:
        conversation_store[thread_id] = conversation_store[thread_id][-19:]
    
    conversation_store[thread_id].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now().isoformat()
    })

# Configure logging
logger = logging.getLogger(__name__)

def retrieve_context(state: AgentState) -> AgentState:
    """Retrieve relevant context using RAG"""
    state = log_step(state, "🔍 Searching knowledge base...")
    
    try:
        last_message = state["messages"][-1]["content"]
        
        # First try semantic search
        chunks = vector_indexer.search_similar_chunks(
            query=last_message,
            project_id="default",
            top_k=3
        )
        
        if chunks:
            context = "\n\n".join([f"📄 Chunk {i+1}:\n{chunk}" for i, chunk in enumerate(chunks)])
            state = log_step(state, f"✅ Found {len(chunks)} relevant chunks")
        else:
            # If no chunks found, try a more general search
            state = log_step(state, "ℹ️ No specific context found, using general knowledge")
            context = "No specific context found in knowledge base. Using general knowledge."
            
        return {**state, "context": context}
        
    except Exception as e:
        error_msg = f"Error retrieving context: {str(e)}"
        logger.error(error_msg)
        state = log_step(state, f"❌ {error_msg}")
        return {**state, "context": "Error retrieving context. Using general knowledge."}

def generate_response(state: AgentState) -> AgentState:
    """Generate response using LLM with context"""
    state = log_step(state, "🧠 Generating response...")
    
    try:
        last_message = state["messages"][-1]
        
        # Limit history to last 5 messages to manage context length
        history = state.get("history", "")
        if len(history) > 2000:  # Rough estimate to keep context manageable
            history = history[-2000:]
        
        # Prepare the prompt with context and history
        prompt = SYSTEM_PROMPT.format(
            context=state.get("context", "No specific context available."),
            history=history,
            question=last_message["content"]
        )
        
        # Create messages for the LLM
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=last_message["content"])
        ]
        
        # Generate response
        response = llm.invoke(messages)
        state = log_step(state, "✅ Response generated")
        
        # Add assistant's response to messages
        return {
            **state,
            "messages": [*state["messages"], {"role": "assistant", "content": response.content}]
        }
        
    except Exception as e:
        error_msg = f"Error generating response: {str(e)}"
        logger.error(error_msg)
        state = log_step(state, f"❌ {error_msg}")
        return {
            **state,
            "messages": [*state["messages"], {
                "role": "assistant", 
                "content": "I encountered an error. Let me try that again."
            }]
        }

def retrieve_context(state: AgentState) -> AgentState:
    """Retrieve relevant context using RAG"""
    if not state["messages"]:
        return state
        
    last_message = state["messages"][-1]["content"]
    # Get relevant chunks from Redis vector store
    try:
        chunks = vector_indexer.search_similar_chunks(
            query=last_message,
            project_id="default",
            top_k=3
        )
        return {**state, "context": "\n\n".join(chunks) if chunks else "No relevant context found"}
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        return {**state, "context": "Error retrieving context"}

def generate_response(state: AgentState) -> AgentState:
    """Generate response using LLM with context"""
    messages = state["messages"].copy()
    
    # Add system message with context
    if state.get("context"):
        system_msg = {
            "role": "system",
            "content": f"Use this context to answer the question:\n{state['context']}"
        }
        messages.insert(0, system_msg)
    
    # Convert to LangChain messages
    lc_messages = []
    for msg in messages:
        if msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))
        elif msg["role"] == "system":
            lc_messages.append(SystemMessage(content=msg["content"]))
    
    # Get response from LLM
    response = llm.invoke(lc_messages)
    
    return {
        **state,
        "messages": [*state["messages"], {"role": "assistant", "content": response.content}]
    }

# Define the agent nodes
def create_agent_workflow():
    """Create and return a compiled agent workflow"""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("retrieve", retrieve_context)
    workflow.add_node("generate", generate_response)
    
    # Define edges
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", END)
    
    # Set entry point
    workflow.set_entry_point("retrieve")
    
    # Compile the workflow
    return workflow.compile()

def check_vector_store():
    """Check if the vector store is properly initialized"""
    try:
        health = vector_indexer.check_index_health("default")
        logger.info(f"Vector store health check: {health}")
        return health
    except Exception as e:
        logger.error(f"Error checking vector store: {e}")
        return {"error": str(e)}

# Initialize the agent
agent = create_agent_workflow()

# Check vector store on startup
check_vector_store()

# Global agent instance
agent = create_agent_workflow()

async def process_message(thread_id: str, content: str, quote: str = None) -> tuple[str, list]:
    """
    Process a message through the agent with RAG and conversation history
    
    Args:
        thread_id: The conversation thread ID
        content: The message content
        quote: Optional quoted text from the conversation
        
    Returns:
        A tuple of (response_text, thinking_steps)
    """
    try:
        # Get conversation history
        history_messages = get_conversation_history(thread_id)
        history_text = "\n".join(
            [f"{msg['role'].capitalize()}: {msg['content']}" 
             for msg in history_messages[-5:]]  # Last 5 messages
        )
        
        # Prepare the message with quote if provided
        user_message = f"{quote}\n\n{content}" if quote else content
        
        # Initialize state with messages and history
        state = {
            "messages": [{"role": "user", "content": user_message}],
            "context": "",
            "thinking_steps": [],
            "history": history_text,
            "thread_id": thread_id
        }
        
        # Run the agent
        result = agent.invoke(state)
        
        # Get the assistant's response and thinking steps
        assistant_response = result["messages"][-1]["content"]
        thinking_steps = result.get("thinking_steps", [])
        
        # Update conversation history
        update_conversation_history(thread_id, "user", content)
        update_conversation_history(thread_id, "assistant", assistant_response)
        
        return assistant_response, thinking_steps
        
    except Exception as e:
        error_msg = f"Error in process_message: {str(e)}"
        logger.error(error_msg)
        return "I encountered an error processing your message. Please try again.", [error_msg]

# Example usage
if __name__ == "__main__":
    # Initialize the vector index
    vector_indexer.create_index("default")
    
    
    # Process the message
    response = process_message(messages)
    print(f"Assistant: {response['content']}")


def create_conversation_thread() -> str:
    """
    Create a new conversation thread.
    
    Returns:
        Thread ID as a string
    """
    thread_id = str(uuid.uuid4())
    logger.info(f"Created new conversation thread: {thread_id}")
    return thread_id
