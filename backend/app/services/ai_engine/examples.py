from typing import Optional
from app.services.ai_engine.base import AIEngine
from app.services.ai_engine.chains.legal_research import LegalResearchChain
from langchain.callbacks import AsyncIteratorCallbackHandler

async def process_legal_query(
    query: str,
    jurisdiction: Optional[str] = None,
    stream: bool = False
) -> str:
    """Example of processing a legal query"""
    
    # Initialize the engine
    callback_handler = AsyncIteratorCallbackHandler() if stream else None
    engine = AIEngine(streaming=stream, callbacks=[callback_handler] if callback_handler else None)
    
    # Create the research chain
    chain = LegalResearchChain(engine)
    
    # Add some example cases if needed
    chain.add_examples([
        {
            "human": "What are the elements of a valid contract?",
            "assistant": "The essential elements of a valid contract are:\n1. Offer\n2. Acceptance\n3. Consideration\n4. Capacity\n5. Intent"
        }
    ])
    
    # Process the query
    metadata = {"jurisdiction": jurisdiction} if jurisdiction else None
    response = await chain.run(query, metadata=metadata)
    
    return response

# Example usage:
"""
async def main():
    query = "What are the requirements for filing a patent?"
    jurisdiction = "United States"
    
    response = await process_legal_query(
        query=query,
        jurisdiction=jurisdiction,
        stream=True
    )
    print(response)
""" 