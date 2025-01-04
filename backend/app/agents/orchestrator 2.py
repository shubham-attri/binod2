from typing import Dict, Any, List, Literal, TypedDict
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_anthropic import ChatAnthropic
from langfuse.callback import CallbackHandler
from .tools import tools
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MessagesState(TypedDict):
    """State schema for messages"""
    messages: List[BaseMessage]
    mode: str
    current_agent: str
    metadata: Dict[str, Any]

class AgentOrchestrator:
    """Orchestrates multiple agents using LangGraph"""
    
    def __init__(self):
        self.tool_node = ToolNode(tools)
        self.langfuse = CallbackHandler(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST
        )
        # Initialize LLM models
        self.research_model = ChatAnthropic(
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            model_name=settings.ANTHROPIC_MODEL
        ).bind_tools(tools)
        self.case_model = ChatAnthropic(
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            model_name=settings.ANTHROPIC_MODEL
        ).bind_tools(tools)
        
        self.graph = self._build_graph()
        logger.info("Initialized Agent Orchestrator")
    
    def should_continue(self, state: MessagesState) -> Literal["tools", END]:
        """Determine if we should continue processing"""
        messages = state["messages"]
        last_message = messages[-1]
        
        # If LLM wants to use tools, continue
        if isinstance(last_message, AIMessage) and last_message.tool_calls:
            return "tools"
        return END
    
    def call_model(self, state: MessagesState) -> Dict:
        """Process with appropriate agent based on mode"""
        try:
            messages = state["messages"]
            mode = state["mode"]
            
            # Select appropriate model
            model = self.research_model if mode == "research" else self.case_model
            
            # Process with model
            response = model.invoke(messages)
            return {"messages": [response]}
            
        except Exception as e:
            logger.error(f"Error in model call: {str(e)}")
            raise
    
    def _build_graph(self) -> StateGraph:
        """Build the agent interaction graph"""
        # Create graph with state schema
        graph = StateGraph(MessagesState)
        
        # Add nodes
        graph.add_node("agent", self.call_model)
        graph.add_node("tools", self.tool_node)
        
        # Set entry point
        graph.add_edge(START, "agent")
        
        # Add conditional edges
        graph.add_conditional_edges(
            "agent",
            self.should_continue,
            {
                "tools": "tools",
                END: END
            }
        )
        
        # Add edge from tools back to agent
        graph.add_edge("tools", "agent")
        
        return graph.compile()
    
    async def process_query(
        self, 
        query: str, 
        mode: str = "research",
        thread_id: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Process query through graph"""
        try:
            # Initialize state
            state = {
                "messages": [HumanMessage(content=query)],
                "mode": mode,
                "current_agent": "",
                "metadata": kwargs
            }
            
            # Process through graph with tracing
            config = {
                "callbacks": [self.langfuse],
                "configurable": {"thread_id": thread_id} if thread_id else {}
            }
            
            result = await self.graph.ainvoke(state, config=config)
            return result
            
        except Exception as e:
            logger.error(f"Error in orchestrator: {str(e)}")
            raise 