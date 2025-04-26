from typing import List
from redis import Redis
from redis.commands.search.field import VectorField, TextField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redisvl.utils.vectorize.text.huggingface import HFTextVectorizer
import logging

logger = logging.getLogger(__name__)

"""
We can select any vector embeddings model if we want to https://docs.redisvl.com/en/latest/api/query.html

We can use text embeddings models from voyage ai, but is paid


"""

def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    """
    Split text into chunks of approximately chunk_size words.
    """
    words = text.split()
    return [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]


class DocumentVectorIndexer:
    """
    Manages Redis vector index for projects and ingests text chunks.
    """
    def __init__(self,
                 redis_host: str = 'redis',
                 redis_port: int = 6379,
                 model_name: str = "sentence-transformers/all-mpnet-base-v2"):
        # decode_responses=False to preserve binary embeddings
        self.redis = Redis(host=redis_host, port=redis_port, decode_responses=False)
        self.vectorizer = HFTextVectorizer(model=model_name)

    def create_index(self, project_id: str, dim: int):
        """
        Create a RediSearch vector index for the given project if not exists.
        """
        index_name = f"rag:{project_id}"
        prefix = f"{index_name}:"
        try:
            # Check if index already exists
            self.redis.ft(index_name).info()
            logger.info(f"Index {index_name} already exists")
        except Exception:
            logger.info(f"Creating new index {index_name}")
            # Define schema: text + vector field
            hparams = {"TYPE": "FLOAT32", "DIM": dim, "DISTANCE_METRIC": "COSINE"}
            schema = (
                TextField("content"),
                VectorField("embedding", "FLAT", hparams)
            )
            definition = IndexDefinition(prefix=[prefix], index_type=IndexType.HASH)
            self.redis.ft(index_name).create_index(schema, definition=definition)

    def ingest(self,
               project_id: str,
               text: str,
               chunk_size: int = 500,
               batch_size: int = 10) -> int:
        """
        Chunk text, embed with HFTextVectorizer, and index into Redis VL.
        Returns number of chunks ingested.
        """
        logger.info(f"Received ingestion request for project_id={project_id}")
        chunks = chunk_text(text, chunk_size)
        logger.info(f"Split text into {len(chunks)} chunks")
        # Batch embed to bytes for storage
        embeddings = self.vectorizer.embed_many(chunks, batch_size=batch_size, as_buffer=True)
        dim = len(embeddings[0])
        # Ensure index
        self.create_index(project_id, dim)
        # Store each chunk
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            key = f"rag:{project_id}:{i}"
            # HSET supports binary values when decode_responses=False
            self.redis.hset(key, mapping={
                "content": chunk,
                "embedding": emb
            })
        logger.info(f"Successfully ingested {len(chunks)} chunks for project_id={project_id}")
        return len(chunks)


# Global indexer instance
indexer = DocumentVectorIndexer()
