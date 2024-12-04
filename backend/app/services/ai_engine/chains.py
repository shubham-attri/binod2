from typing import Any, Dict, Optional, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.ai_engine.base import AIEngine

class BaseChain:
    """Base class for all chains"""
    
    def __init__(
        self,
        engine: AIEngine,
        system_prompt: str,
        input_variables: List[str]
    ):
        self.engine = engine
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])
        self.input_variables = input_variables
    
    async def run(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Run the chain"""
        # Format input variables
        input_dict = {"input": input_text}
        if context:
            input_dict.update(context)
            
        # Create messages from prompt
        messages = self.prompt.format_messages(**input_dict)
        
        # Run through the model
        response = await self.engine.model.agenerate([messages])
        return response.generations[0][0].text
    
    def add_examples(self, examples: List[Dict[str, str]]):
        """Add few-shot examples to the chain"""
        messages = []
        for example in examples:
            if "human" in example:
                messages.append(("human", example["human"]))
            if "assistant" in example:
                messages.append(("assistant", example["assistant"]))
        
        # Update prompt with examples
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.prompt.messages[0].content),  # System prompt
            *messages,  # Examples
            ("human", "{input}")  # User input
        ]) 