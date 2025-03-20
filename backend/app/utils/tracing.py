import os
from typing import Dict, Any, Optional, List, Union
from loguru import logger

try:
    import langfuse
    from langfuse.client import Langfuse
    
    # Initialize Langfuse client from environment variables
    langfuse_client = Langfuse(
        public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
        secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
        host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
    )
    
    has_langfuse = True
    logger.info("Langfuse initialized")
except Exception as e:
    logger.warning(f"Langfuse not available: {e}")
    has_langfuse = False

class Tracer:
    """Tracer utility for logging events and collecting feedback using Langfuse"""
    
    def __init__(self):
        """Initialize the tracer"""
        self.has_langfuse = has_langfuse
    
    def create_trace(
        self, 
        name: str, 
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a new trace
        
        Args:
            name: The name of the trace
            user_id: The ID of the user
            metadata: Additional metadata for the trace
            
        Returns:
            str: The ID of the created trace
        """
        if not self.has_langfuse:
            logger.info(f"Would create trace: {name} (user: {user_id})")
            return "dummy-trace-id"
        
        trace = langfuse_client.trace(
            name=name,
            user_id=user_id,
            metadata=metadata or {}
        )
        
        logger.info(f"Created trace: {trace.id} (name: {name}, user: {user_id})")
        return trace.id
    
    def log_event(
        self,
        trace_id: str,
        name: str,
        event_type: str = "event",
        metadata: Optional[Dict[str, Any]] = None,
        input_data: Optional[Union[Dict[str, Any], List, str]] = None,
        output_data: Optional[Union[Dict[str, Any], List, str]] = None,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None
    ) -> str:
        """
        Log an event in a trace
        
        Args:
            trace_id: The ID of the trace
            name: The name of the event
            event_type: The type of event (e.g., 'llm', 'tool', 'retrieval')
            metadata: Additional metadata for the event
            input_data: Input data for the event
            output_data: Output data from the event
            start_time: Start time of the event (timestamp)
            end_time: End time of the event (timestamp)
            
        Returns:
            str: The ID of the created event
        """
        if not self.has_langfuse:
            logger.info(f"Would log event: {name} (trace: {trace_id}, type: {event_type})")
            return "dummy-event-id"
        
        event = langfuse_client.event(
            id=None,  # Auto-generate ID
            trace_id=trace_id,
            name=name,
            input=input_data,
            output=output_data,
            metadata=metadata or {},
            start_time=start_time,
            end_time=end_time
        )
        
        logger.info(f"Logged event: {event.id} (name: {name}, trace: {trace_id})")
        return event.id
    
    def log_feedback(
        self,
        trace_id: str,
        score: float,
        feedback_type: str = "user",
        comment: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log feedback for a trace
        
        Args:
            trace_id: The ID of the trace
            score: The feedback score (-1 to 1)
            feedback_type: The type of feedback
            comment: Optional comment with the feedback
            metadata: Additional metadata for the feedback
            
        Returns:
            str: The ID of the created feedback
        """
        if not self.has_langfuse:
            logger.info(f"Would log feedback: {score} (trace: {trace_id}, type: {feedback_type})")
            return "dummy-feedback-id"
        
        feedback = langfuse_client.feedback(
            trace_id=trace_id,
            name=feedback_type,
            score=score,
            comment=comment,
            metadata=metadata or {}
        )
        
        logger.info(f"Logged feedback: {feedback.id} (score: {score}, trace: {trace_id})")
        return feedback.id
    
    def log_span(
        self,
        trace_id: str,
        name: str,
        span_type: str = "span",
        metadata: Optional[Dict[str, Any]] = None,
        input_data: Optional[Union[Dict[str, Any], List, str]] = None,
        output_data: Optional[Union[Dict[str, Any], List, str]] = None,
        parent_id: Optional[str] = None,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None
    ) -> str:
        """
        Log a span in a trace
        
        Args:
            trace_id: The ID of the trace
            name: The name of the span
            span_type: The type of span
            metadata: Additional metadata for the span
            input_data: Input data for the span
            output_data: Output data from the span
            parent_id: ID of the parent span
            start_time: Start time of the span (timestamp)
            end_time: End time of the span (timestamp)
            
        Returns:
            str: The ID of the created span
        """
        if not self.has_langfuse:
            logger.info(f"Would log span: {name} (trace: {trace_id}, type: {span_type})")
            return "dummy-span-id"
        
        span = langfuse_client.span(
            id=None,  # Auto-generate ID
            trace_id=trace_id,
            name=name,
            parent_id=parent_id,
            span_type=span_type,
            input=input_data,
            output=output_data,
            metadata=metadata or {},
            start_time=start_time,
            end_time=end_time
        )
        
        logger.info(f"Logged span: {span.id} (name: {name}, trace: {trace_id})")
        return span.id

# Create a singleton instance
tracer = Tracer() 