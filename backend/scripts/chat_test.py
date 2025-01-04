#!/usr/bin/env python3

import asyncio
import sys
sys.path.append(".")  # Add the current directory to Python path

from app.services.chat import ChatService
from app.core.config import settings
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    try:
        chat_service = ChatService()
        print("\nAgent Binod Chat Test Interface")
        print("Type 'exit' to quit\n")

        while True:
            # Get user input
            user_input = input("You: ")
            
            if user_input.lower() == 'exit':
                break

            # Get AI response
            print("\nAgent: ", end='', flush=True)
            async for token in chat_service.get_streaming_response(user_input):
                print(token, end='', flush=True)
            print("\n")

    except Exception as e:
        logger.error(f"Error in chat test: {str(e)}")
        raise e

if __name__ == "__main__":
    asyncio.run(main()) 