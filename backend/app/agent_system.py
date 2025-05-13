"""
LangGraph Agent System for Binod AI Assistant.

This module implements a LangGraph-based agent that integrates with the OpenRouter LLM
and provides a structured approach to handling conversations and tool usage.
"""

import os
import logging
import uuid
from typing import Annotated, Dict, List, Any, Optional, TypedDict, Tuple
from typing_extensions import TypedDict

from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage, BaseMessage
from langchain.tools import BaseTool, StructuredTool, tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages

from .llm_client import llm_client
from .vector_indexer import indexer

# Configure logging
logger = logging.getLogger(__name__)

# Custom message types for our agent
class Message(TypedDict):
    role: str  # "user", "assistant", "system", "tool"
    content: str
    name: Optional[str]  # Used for tool calls

# State definition for our agent
class AgentState(TypedDict):
    # Messages have the type "list". The `add_messages` function
    # in the annotation defines how this state key should be updated
    # (it appends messages to the list, rather than overwriting them)
    messages: Annotated[List[Message], add_messages]
    # Current thread/conversation ID
    thread_id: str
    # Optional context from vector search
    context: Optional[str]
    # Tool results when tools are called
    tool_results: Optional[Dict[str, Any]]

# Define tools that our agent can use
@tool
def search_documents(query: str, thread_id: str) -> str:
    """
    Search for relevant documents based on the query.
    
    Args:
        query: The search query
        thread_id: The conversation thread ID
        
    Returns:
        Relevant information from documents
    """
    try:
        results = indexer.search(thread_id, query, top_k=3)
        if not results or len(results) == 0:
            return "No relevant documents found."
        
        # Format results
        formatted_results = []
        for i, result in enumerate(results, 1):
            formatted_results.append(f"Document {i}:\n{result.get('text', '')}")
        
        return "\n\n".join(formatted_results)
    except Exception as e:
        logger.error(f"Error searching documents: {e}")
        return f"Error searching documents: {str(e)}"

# Create a list of tools
tools = [search_documents]

# Create a wrapper for our LangChain LLM to make it compatible with LangGraph
class LangChainLLMWrapper:
    """Wrapper for LangChain LLM to make it compatible with LangGraph."""
    
    def __init__(self):
        """Initialize the wrapper."""
        # Use the LangChain-compatible ChatOpenRouter
        self.client = llm_client
    
    async def ainvoke(self, messages, **kwargs) -> Dict[str, Any]:
        """
        Asynchronously invoke the LLM.
        
        Args:
            messages: List of LangChain message objects
            **kwargs: Additional arguments to pass to the LLM
            
        Returns:
            LLM response
        """
        try:
            # LangChain model already accepts LangChain message objects
            # Get context if provided and add as system message if needed
            context = kwargs.get("context")
            if context and not any(isinstance(m, SystemMessage) for m in messages):
                # Add context as system message
                system_message = SystemMessage(content=f"You are a helpful AI assistant. Use the following context to help answer the user's question: {context}")
                messages = [system_message] + list(messages)
            
            # Call the LLM - LangChain handles caching automatically
            response = await self.client.ainvoke(
                messages,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 1000)
            )
            
            # Return the response
            return {"message": response}
        except Exception as e:
            logger.error(f"Error invoking LLM: {e}")
            logger.exception("Detailed error in ainvoke:")
            return {"message": AIMessage(content="I encountered an error processing your request.")}
    
    def invoke(self, messages, **kwargs) -> Dict[str, Any]:
        """
        Synchronously invoke the LLM (wrapper for async implementation).
        
        Args:
            messages: List of LangChain message objects
            **kwargs: Additional arguments to pass to the LLM
            
        Returns:
            LLM response
        """
        try:
            # Get context if provided and add as system message if needed
            context = kwargs.get("context")
            if context and not any(isinstance(m, SystemMessage) for m in messages):
                # Add context as system message
                system_message = SystemMessage(content=f"You are a helpful AI assistant. Use the following context to help answer the user's question: {context}")
                messages = [system_message] + list(messages)
            
            # Call the LLM directly - LangChain handles caching automatically
            # This is more efficient than using asyncio for synchronous calls
            response = self.client.invoke(
                messages,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 1000),
                stream=True
            )
            
            # Return the response
            return {"message": response}
        except Exception as e:
            logger.error(f"Error invoking LLM: {e}")
            logger.exception("Detailed error in invoke:")
            return {"message": AIMessage(content="I encountered an error processing your request.")}

# Initialize the LLM wrapper
llm = LangChainLLMWrapper()

# Define the agent nodes
def retrieve_context(state: AgentState) -> AgentState:
    """
    Retrieve relevant context from the vector store.
    
    Args:
        state: Current agent state
        
    Returns:
        Updated agent state with context
    """
    try:
        # Get thread ID from state
        thread_id = state["thread_id"]
        
        # Extract user query from the most recent user message
        user_query = ""
        messages = state.get("messages", [])
        
        # Debug logging
        logger.info(f"Messages in state: {len(messages)} messages")
        for i, msg in enumerate(messages):
            logger.info(f"Message {i} type: {type(msg)}")
        
        # Try to find the latest user message
        for message in reversed(messages):
            # Case 1: LangChain HumanMessage object
            if isinstance(message, HumanMessage):
                user_query = message.content
                logger.info(f"Found HumanMessage with content: {user_query[:50]}...")
                break
            # Case 2: Dictionary with role and content
            elif isinstance(message, dict) and "role" in message and "content" in message:
                if message["role"] == "user":
                    user_query = message["content"]
                    logger.info(f"Found dict message with user role: {user_query[:50]}...")
                    break
            # Case 3: Other LangChain message types
            elif hasattr(message, "type") and hasattr(message, "content"):
                if message.type == "human":
                    user_query = message.content
                    logger.info(f"Found message with human type: {user_query[:50]}...")
                    break
            # Log unrecognized message format
            else:
                logger.warning(f"Unrecognized message format: {type(message)}")
        
        # If no user query found, return empty context
        if not user_query:
            logger.warning("No user query found in messages")
            return {"context": None}
        
        # Search for relevant documents
        logger.info(f"Searching for context with query: {user_query[:50]}...")
        results = indexer.search(thread_id, user_query, top_k=3)
        
        if results and len(results) > 0:
            # Format context from results
            context_parts = []
            for i, result in enumerate(results, 1):
                context_parts.append(f"Document {i}:\n{result.get('text', '')}")
            
            context = "\n\n".join(context_parts)
            logger.info(f"Retrieved context for thread {thread_id}: {len(context)} chars")
            return {"context": context}
        else:
            logger.info(f"No relevant context found for thread {thread_id}")
            return {"context": None}
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        logger.exception("Detailed error in retrieve_context:")
        return {"context": None}

def generate_response(state: AgentState) -> AgentState:
    """
    Generate a response using the LLM.
    
    Args:
        state: Current agent state
        
    Returns:
        Updated agent state with assistant response
    """
    # Convert dictionary messages to LangChain message objects
    langchain_messages = []
    context = state.get("context")
    
    try:
        # Add system message with context if available
        if context:
            system_content = (
                "You are a helpful AI assistant. "
                "Use the following context to help answer the user's question if relevant:\n\n"
                f"{context}"
            )
            langchain_messages.append(SystemMessage(content=system_content))
        
        # Convert messages to LangChain format
        for message in state["messages"]:
            if isinstance(message, dict):
                role = message.get("role", "")
                content = message.get("content", "")
                
                if role == "user":
                    langchain_messages.append(HumanMessage(content=content))
                elif role == "assistant":
                    langchain_messages.append(AIMessage(content=content))
                elif role == "system":
                    # Skip if we already added a system message with context
                    if not context or not langchain_messages:
                        langchain_messages.append(SystemMessage(content=content))
            else:
                # Message is already a LangChain message object
                langchain_messages.append(message)
        
        # Log the messages we're sending to the LLM
        logger.info(f"Sending {len(langchain_messages)} messages to LLM")
        for i, msg in enumerate(langchain_messages):
            if hasattr(msg, 'type') and hasattr(msg, 'content'):
                logger.info(f"Message {i}: type={msg.type}, content={msg.content[:50]}...")
        
        # Generate response using the LLM wrapper
        response = llm.invoke(langchain_messages, context=context)
        
        # Extract the assistant message from the response
        if "message" in response:
            assistant_message = response["message"]
            logger.info(f"Got response from LLM: {type(assistant_message)}")
            
            # Return the assistant message
            return {"messages": [assistant_message]}
        else:
            logger.error(f"Unexpected response format: {response}")
            return {"messages": [AIMessage(content="I apologize, but I received an unexpected response format.")]}
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        logger.exception("Detailed error in generate_response:")
        return {"messages": [AIMessage(content="I apologize, but I encountered an error processing your request.")]}

# Define the agent graph
def create_agent_graph() -> StateGraph:
    """
    Create the agent graph with nodes and edges.
    
    Returns:
        Compiled agent graph
    """
    # Create the graph builder
    graph_builder = StateGraph(AgentState)
    
    # Add nodes
    graph_builder.add_node("retrieve_context", retrieve_context)
    graph_builder.add_node("generate_response", generate_response)
    
    # Add edges
    graph_builder.add_edge(START, "retrieve_context")
    graph_builder.add_edge("retrieve_context", "generate_response")
    
    # Compile the graph
    return graph_builder.compile()

# Create the agent graph
agent_graph = create_agent_graph()

async def process_agent_message(thread_id: str, user_message: str, quote_text: str = None) -> Tuple[str, List[str]]:
    """
    Process a user message through the agent graph.
    
    Args:
        thread_id: The conversation thread ID
        user_message: The user's message
        quote_text: Optional text quoted by the user
        
    Returns:
        Tuple of (assistant_response, thinking_steps)
    """
    # Initialize thinking steps
    thinking_steps = [
        "Processing your message...",
        "Searching for relevant information...",
        "Generating response..."
    ]
    
    try:
        # Create initial state with LangChain message object
        message_content = user_message
        
        # If there's quoted text, include it in the message
        if quote_text:
            message_content = f"User message: {user_message}\n\nQuoted text: {quote_text}"
            logger.info(f"Processing message with quote for thread {thread_id}")
            
        initial_state = {
            "messages": [HumanMessage(content=message_content)],
            "thread_id": thread_id,
            "context": None,
            "tool_results": None
        }
        
        # Process through the graph
        logger.info(f"Processing message for thread {thread_id}")
        result = None
        
        # Stream through the graph to get intermediate results
        for event in agent_graph.stream(initial_state):
            # Track progress through nodes
            if "retrieve_context" in event:
                thinking_steps[1] = "Found relevant information in your documents"
            if "generate_response" in event:
                result = event["generate_response"]
        
        # Extract the assistant's response
        if result and "messages" in result and result["messages"]:
            message = result["messages"][-1]
            # Handle both LangChain message objects and dictionaries
            if isinstance(message, BaseMessage):
                assistant_response = message.content
            elif isinstance(message, dict) and "content" in message:
                assistant_response = message["content"]
            else:
                logger.error(f"Unknown message format: {type(message)}")
                assistant_response = "I apologize, but I couldn't generate a proper response."
                
            logger.info(f"Generated response for thread {thread_id}")
            return assistant_response, thinking_steps
        else:
            logger.error(f"No response generated for thread {thread_id}")
            return "I apologize, but I couldn't generate a response.", thinking_steps
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return f"I encountered an error: {str(e)}", thinking_steps

# Function to create a new conversation thread
def create_conversation_thread() -> str:
    """
    Create a new conversation thread.
    
    Returns:
        Thread ID
    """
    return str(uuid.uuid4())
