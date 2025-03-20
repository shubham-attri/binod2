import os
import time
from typing import Dict, Any, List, Optional, Tuple
from loguru import logger
from ..rag.vector_store_redisvl import vector_store
from ..utils.tracing import tracer
from ..utils.llm_proxy import llm_proxy
import json
import asyncio

try:
    from langchain.prompts import PromptTemplate
    from langchain.chains import LLMChain
    from langchain.chat_models import ChatOpenAI
    from langchain.chains.conversation.memory import ConversationBufferMemory
    from langchain.output_parsers import StructuredOutputParser, ResponseSchema
    from langchain.tools import Tool
    from langchain.agents import AgentExecutor, create_react_agent
    
    # Initialize LangChain - we'll still use LangChain for the agent infrastructure
    # but the actual LLM calls will go through our LiteLLM proxy
    llm = ChatOpenAI(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        model_name="gpt-3.5-turbo-16k",
        temperature=0.7,
        streaming=True
    )
    
    has_langchain = True
    logger.info("LangChain initialized")
except Exception as e:
    logger.warning(f"LangChain not available: {e}")
    has_langchain = False

# Define schemas for structured thinking steps
thinking_schemas = [
    ResponseSchema(name="step", description="The thinking step description"),
    ResponseSchema(name="reasoning", description="The reasoning behind this step")
]

# Initialize output parser for thinking steps
thinking_parser = StructuredOutputParser.from_response_schemas(thinking_schemas)
thinking_format_instructions = thinking_parser.get_format_instructions()

def create_vector_search_tool():
    """Create a vector search tool for RAG"""
    
    def vector_search(query: str, top_k: int = 5) -> str:
        """Search for documents in the vector store"""
        try:
            # Log the vector search
            logger.info(f"Performing vector search: {query}")
            
            # Perform the search
            results = vector_store.similarity_search(query, k=top_k)
            
            # Format the results
            formatted_results = []
            for i, doc in enumerate(results):
                formatted_results.append(
                    f"[Document {i+1}]\n"
                    f"Content: {doc.page_content}\n"
                    f"Source: {doc.metadata.get('source', 'Unknown')}\n"
                )
            
            # Return the formatted results
            return "\n\n".join(formatted_results)
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return f"Error performing vector search: {str(e)}"
    
    # Create the tool
    return Tool(
        name="vector_search",
        description="Search for relevant documents using semantic similarity",
        func=vector_search
    )

class ChatAgent:
    """Chat agent using LangChain with RAG integration"""
    
    def __init__(self):
        """Initialize the chat agent"""
        self.has_langchain = has_langchain
        self.tools = [create_vector_search_tool()]
        
        # Agent executor
        if self.has_langchain:
            # Define the prompt for the agent
            prompt = PromptTemplate.from_template(
                """You are a legal assistant named Binod. You help with legal analysis, research, and drafting. 
                You are given a message by the user, and you can use tools to help you respond.
                
                When you need to provide legal information, make sure to cite your sources. When drafting legal documents,
                follow proper legal formatting and conventions.
                
                {chat_history}
                
                User: {input}
                {agent_scratchpad}"""
            )
            
            # Create the agent using ReAct framework
            self.agent = create_react_agent(llm, self.tools, prompt)
            
            # Create agent executor
            self.executor = AgentExecutor(
                agent=self.agent,
                tools=self.tools,
                verbose=True,
                handle_parsing_errors=True,
                max_iterations=5
            )
            
            logger.info("Chat agent initialized")
        else:
            logger.warning("Chat agent not initialized (LangChain not available)")
    
    async def _direct_thinking_steps(self, message: str) -> List[Dict[str, str]]:
        """Generate thinking steps using LiteLLM directly instead of LangChain"""
        try:
            # Create a thinking prompt
            prompt = f"""You are a legal assistant thinking through how to answer a question step by step.
            For the following query, provide 3-5 numbered thinking steps with reasoning for each step.
            Each step should represent your internal thought process.
            
            Query: {message}
            
            For each step, provide:
            - Step: The thinking step description
            - Reasoning: The reasoning behind this step
            
            Format your response as a list of JSON objects, with each object having 'step' and 'reasoning' fields.
            """
            
            # Get completion from LiteLLM
            response = await llm_proxy.generate_completion(
                prompt=prompt,
                temperature=0.7,
                max_tokens=1000
            )
            
            # Extract content
            content = response['choices'][0]['message']['content']
            
            # Try to extract the structured steps
            try:
                # Check if the content contains a JSON array
                if '[' in content and ']' in content:
                    # Extract the JSON array
                    start_idx = content.find('[')
                    end_idx = content.rfind(']') + 1
                    json_str = content[start_idx:end_idx]
                    
                    # Parse the JSON array
                    steps = json.loads(json_str)
                    
                    # Validate steps
                    for step in steps:
                        if 'step' not in step or 'reasoning' not in step:
                            raise ValueError("Invalid step format")
                    
                    return steps
                else:
                    # Try to extract step/reasoning pairs from unstructured text
                    lines = content.split('\n')
                    steps = []
                    current_step = {}
                    
                    for line in lines:
                        line = line.strip()
                        if line.startswith("Step:") or line.startswith("- Step:"):
                            if current_step and 'step' in current_step:
                                steps.append(current_step)
                                current_step = {}
                            current_step['step'] = line.split(":", 1)[1].strip()
                        elif line.startswith("Reasoning:") or line.startswith("- Reasoning:"):
                            current_step['reasoning'] = line.split(":", 1)[1].strip()
                    
                    if current_step and 'step' in current_step and 'reasoning' in current_step:
                        steps.append(current_step)
                    
                    if steps:
                        return steps
            except Exception as e:
                logger.error(f"Error parsing thinking steps: {e}")
            
            # Fallback: Generate basic steps from the content
            steps = []
            paragraphs = content.split('\n\n')
            
            for i, para in enumerate(paragraphs[:5], 1):
                if para.strip():
                    steps.append({
                        "step": f"Step {i}: {para.split('.')[0]}",
                        "reasoning": para
                    })
            
            return steps
        except Exception as e:
            logger.error(f"Error generating thinking steps with LiteLLM: {e}")
            return [
                {"step": "Reading and analyzing input", "reasoning": "Need to understand the query"},
                {"step": "Error occurred during processing", "reasoning": f"An error occurred: {str(e)}"}
            ]
    
    async def generate_thinking_steps(self, message: str) -> List[Dict[str, str]]:
        """Generate thinking steps for a message"""
        if not self.has_langchain:
            # Use direct LiteLLM call
            return await self._direct_thinking_steps(message)
            
        try:
            # Create a thinking prompt
            thinking_prompt = PromptTemplate.from_template(
                """You are a legal assistant thinking through how to answer a question step by step.
                For the following query, provide 3-5 numbered thinking steps with reasoning for each step.
                Each step should represent your internal thought process.
                
                Query: {input}
                
                {format_instructions}
                """
            )
            
            # Create a thinking chain
            thinking_chain = LLMChain(
                llm=llm,
                prompt=thinking_prompt
            )
            
            # Run the thinking chain
            result = await thinking_chain.arun(
                input=message,
                format_instructions=thinking_format_instructions
            )
            
            # Parse the result
            parsed_steps = thinking_parser.parse(result)
            
            # Format the steps
            thinking_steps = []
            if isinstance(parsed_steps, dict) and "step" in parsed_steps and "reasoning" in parsed_steps:
                # Handle single step
                thinking_steps = [parsed_steps]
            elif isinstance(parsed_steps, list):
                # Handle multiple steps
                thinking_steps = parsed_steps
            else:
                # Fallback
                thinking_steps = [{"step": step} for step in result.split("\n") if step.strip()]
            
            logger.info(f"Generated {len(thinking_steps)} thinking steps")
            return thinking_steps
        except Exception as e:
            logger.error(f"Error generating thinking steps: {e}")
            # Return basic steps on error
            return [
                {"step": "Reading and analyzing input", "reasoning": "Need to understand the query"},
                {"step": "Error occurred during processing", "reasoning": f"An error occurred: {str(e)}"}
            ]
    
    async def _direct_generate_response(
        self, 
        message: str, 
        file_url: Optional[str] = None,
        quote: Optional[str] = None
    ) -> str:
        """Generate a response using LiteLLM directly instead of LangChain"""
        try:
            # Prepare the vector search results
            vector_search_results = ""
            try:
                results = vector_store.similarity_search(message, k=3)
                if results:
                    vector_search_results = "Relevant information from our database:\n\n"
                    for i, doc in enumerate(results):
                        vector_search_results += f"[Document {i+1}]\n"
                        vector_search_results += f"Content: {doc.page_content}\n"
                        vector_search_results += f"Source: {doc.metadata.get('source', 'Unknown')}\n\n"
            except Exception as e:
                logger.error(f"Error performing vector search: {e}")
            
            # Construct the prompt
            prompt = f"""You are a legal assistant named Binod. You help with legal analysis, research, and drafting. 
            
            When you need to provide legal information, make sure to cite your sources. When drafting legal documents,
            follow proper legal formatting and conventions.
            
            User message: {message}
            """
            
            if quote:
                prompt += f"\n\nQuoted text for reference: {quote}"
            
            if file_url:
                prompt += f"\n\nPlease analyze the document at: {file_url}"
            
            if vector_search_results:
                prompt += f"\n\n{vector_search_results}"
            
            prompt += "\n\nPlease provide a helpful, accurate, and comprehensive response:"
            
            # Generate completion using LiteLLM
            messages = [{"role": "user", "content": prompt}]
            response = await llm_proxy.generate_chat_completion(
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            # Extract content
            content = response['choices'][0]['message']['content']
            return content
        except Exception as e:
            logger.error(f"Error generating response with LiteLLM: {e}")
            return f"I apologize, but I encountered an error: {str(e)}"
    
    async def generate_response(
        self, 
        message: str, 
        session_id: str,
        file_url: Optional[str] = None,
        quote: Optional[str] = None
    ) -> Tuple[str, List[Dict[str, str]]]:
        """
        Generate a response to a message
        
        Args:
            message: The message to respond to
            session_id: The session ID
            file_url: Optional URL to a file
            quote: Optional quoted text
            
        Returns:
            Tuple[str, List[Dict[str, str]]]: The response and thinking steps
        """
        # Create a trace
        trace_id = tracer.create_trace(
            name="chat_response", 
            user_id=session_id,
            metadata={
                "message": message,
                "file_url": file_url,
                "quote": quote
            }
        )
        
        # Generate thinking steps
        thinking_start = time.time()
        thinking_steps = await self.generate_thinking_steps(message)
        thinking_end = time.time()
        
        # Log thinking steps
        tracer.log_span(
            trace_id=trace_id,
            name="thinking_steps",
            span_type="thinking",
            input_data=message,
            output_data=thinking_steps,
            start_time=thinking_start,
            end_time=thinking_end
        )
        
        try:
            if not self.has_langchain:
                # Use direct LiteLLM call
                response = await self._direct_generate_response(message, file_url, quote)
                return response, thinking_steps
            
            # Prepare input
            input_text = message
            if quote:
                input_text += f"\n\nQuote for reference: {quote}"
            if file_url:
                input_text += f"\n\nPlease analyze the document at: {file_url}"
            
            # Run the agent
            agent_start = time.time()
            response = await self.executor.arun(
                input=input_text,
                chat_history=[]  # We'll implement chat history later
            )
            agent_end = time.time()
            
            # Log agent execution
            tracer.log_span(
                trace_id=trace_id,
                name="agent_execution",
                span_type="llm",
                input_data=input_text,
                output_data=response,
                start_time=agent_start,
                end_time=agent_end
            )
            
            return response, thinking_steps
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            error_response = f"I apologize, but I encountered an error: {str(e)}"
            
            # Log error
            tracer.log_event(
                trace_id=trace_id,
                name="error",
                event_type="error",
                metadata={"error": str(e)}
            )
            
            return error_response, thinking_steps

# Create a singleton instance
chat_agent = ChatAgent() 