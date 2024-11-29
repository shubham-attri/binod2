from redis_om import get_redis_connection, HashModel, Field
from ..core.config import get_settings
from typing import Optional, Dict, Any, List
import json

settings = get_settings()

class DocumentVector(HashModel):
    content: str = Field(index=True)
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    embedding: List[float] = Field(index=True)
    document_id: str = Field(index=True)

    class Meta:
        database = get_redis_connection(
            url=settings.REDIS_URL,
            decode_responses=True
        )

class RedisService:
    def __init__(self):
        self.redis = get_redis_connection(
            url=settings.REDIS_URL,
            decode_responses=True
        )

    async def store_vector(self, 
                          content: str, 
                          embedding: List[float], 
                          document_id: str, 
                          metadata: Optional[Dict[str, Any]] = None) -> str:
        vector = DocumentVector(
            content=content,
            embedding=embedding,
            document_id=document_id,
            metadata=json.dumps(metadata) if metadata else None
        )
        await vector.save()
        return vector.pk

    async def search_vectors(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        # Implement vector similarity search
        # This is a placeholder - actual implementation will depend on your specific needs
        return []

    async def get_vector(self, vector_id: str) -> Optional[Dict[str, Any]]:
        vector = await DocumentVector.get(vector_id)
        if vector:
            return {
                "content": vector.content,
                "embedding": vector.embedding,
                "document_id": vector.document_id,
                "metadata": json.loads(vector.metadata) if vector.metadata else None
            }
        return None

redis_service = RedisService() 