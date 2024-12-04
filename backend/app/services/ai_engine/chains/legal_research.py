from typing import Any, Dict, Optional
from app.services.ai_engine.chains import BaseChain
from app.services.ai_engine.base import AIEngine

class LegalResearchChain(BaseChain):
    """Chain for handling legal research queries"""
    
    def __init__(self, engine: AIEngine):
        system_prompt = """You are Agent Binod, a legal research assistant.
        Your task is to provide accurate, well-researched legal information.
        Always:
        1. Cite relevant legal sources and precedents
        2. Explain complex legal concepts in clear terms
        3. Consider multiple perspectives
        4. Highlight any limitations or uncertainties
        5. Provide practical implications when relevant
        """
        
        input_variables = ["query", "context", "jurisdiction"]
        super().__init__(engine, system_prompt, input_variables)
    
    async def run(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Run the legal research chain"""
        # Add jurisdiction if provided in metadata
        jurisdiction = metadata.get("jurisdiction", "General") if metadata else "General"
        
        # Format the input with jurisdiction
        formatted_input = f"[Jurisdiction: {jurisdiction}]\n\n{input_text}"
        
        # Get response from base chain
        response = await super().run(formatted_input, context, metadata)
        
        # Post-process to ensure citations
        if "References:" not in response:
            response += "\n\nReferences:\n- Based on general legal principles and common law understanding."
            
        return response 