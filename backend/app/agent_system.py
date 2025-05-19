"""
Simplified Agent System using LangGraph
"""
from typing import List, Dict, Any, Optional
import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from app.llm_client import llm
from app.vector_indexer import vector_indexer

# Configure logging
logger = logging.getLogger(__name__)

class AgentState(dict):
    """State for our agent workflow"""
    messages: List[Dict[str, str]]
    context: Optional[str] = ""

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

# Global agent instance
agent = create_agent_workflow()

async def process_message(thread_id: str, content: str, quote: str = None) -> tuple[str, list]:
    """
    Process a message through the agent
    
    Args:
        thread_id: The conversation thread ID
        content: The message content
        quote: Optional quoted text from the conversation
        
    Returns:
        A tuple of (response_text, thinking_steps)
    """
    try:
        # Get the conversation history
        messages = [
            {"role": "user", "content": content}
        ]
        
        # Add quote to the message if provided
        if quote:
            messages[0]["content"] = f"{quote}\n\n{content}"
        
        # Initialize state with messages
        state = {"messages": messages}
        
        # Run the agent
        result = agent.invoke(state)
        
        # Get the assistant's response
        assistant_response = result["messages"][-1]["content"]
        
        # Return response and empty thinking steps list (can be updated later)
        return assistant_response, []
        
    except Exception as e:
        logger.error(f"Error in process_message: {e}")
        return "I encountered an error processing your message. Please try again.", []

# Example usage
if __name__ == "__main__":
    # Initialize the vector index
    vector_indexer.create_index("default")
    
    # Example conversation
    messages = [
        {"role": "user", "content": "What is RAG?"}
    ]
    
    # Process the message
    response = process_message(messages)
    print(f"Assistant: {response['content']}")

import uuid

def create_conversation_thread() -> str:
    """
    Create a new conversation thread.
    
    Returns:
        Thread ID as a string
    """
    thread_id = str(uuid.uuid4())
    logger.info(f"Created new conversation thread: {thread_id}")
    return thread_id
