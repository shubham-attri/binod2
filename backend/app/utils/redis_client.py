import redis
import os
import json
import asyncio
from loguru import logger
from typing import Dict, Any, Optional, Callable, Awaitable

class RedisClient:
    """Redis client utility for connecting to Redis and handling Pub/Sub"""
    
    def __init__(self, url: Optional[str] = None):
        """Initialize the Redis client with the given URL or from environment variables"""
        self.redis_url = url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client = redis.from_url(self.redis_url)
        self.pubsub = self.client.pubsub()
        
        # Test connection
        try:
            self.client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
        
    def publish(self, channel: str, message: Dict[str, Any]) -> int:
        """Publish a message to a channel"""
        return self.client.publish(channel, json.dumps(message))
    
    async def subscribe_and_listen(
        self, 
        channel: str, 
        callback: Callable[[Dict[str, Any]], Awaitable[None]]
    ) -> None:
        """Subscribe to a channel and listen for messages"""
        self.pubsub.subscribe(channel)
        
        # Run in a loop to receive messages
        while True:
            try:
                message = self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    data = json.loads(message["data"])
                    await callback(data)
                
                # Sleep briefly to avoid high CPU usage
                await asyncio.sleep(0.01)
            except Exception as e:
                logger.error(f"Error in Redis subscription: {e}")
                await asyncio.sleep(1.0)  # Wait before retrying
                
    def hset(self, key: str, mapping: Dict[str, Any]) -> int:
        """Set multiple fields in a hash"""
        return self.client.hset(key, mapping=mapping)
    
    def hgetall(self, key: str) -> Dict[str, Any]:
        """Get all fields and values in a hash"""
        result = self.client.hgetall(key)
        # Convert bytes to strings in the result
        return {k.decode('utf-8'): v.decode('utf-8') for k, v in result.items()}
    
    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Set a key with an optional expiration time"""
        return self.client.set(key, value, ex=ex)
    
    def get(self, key: str) -> Optional[str]:
        """Get a value by key"""
        result = self.client.get(key)
        return result.decode('utf-8') if result else None

# Create a singleton instance
redis_client = RedisClient() 