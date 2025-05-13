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
        return self.ingest_chunks(project_id, chunks, batch_size)

    def ingest_chunks(self, project_id: str, chunks: List[str], batch_size: int = 10) -> int:
        """Embed and index pre-split text chunks."""
        logger.info(f"Received ingestion for project_id={project_id}, chunks={len(chunks)}")
        embeddings = self.vectorizer.embed_many(chunks, batch_size=batch_size, as_buffer=True)
        dim = len(embeddings[0])
        self.create_index(project_id, dim)
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            key = f"rag:{project_id}:{i}"
            self.redis.hset(key, mapping={"content": chunk, "embedding": emb})
        logger.info(f"Successfully ingested {len(chunks)} chunks for project_id={project_id}")
        return len(chunks)
        
    def search(self, project_id: str, query: str, top_k: int = 3) -> List[dict]:
        """
        Search for relevant text chunks based on semantic similarity to the query.
        
        Args:
            project_id: The project/conversation ID to search within
            query: The search query text
            top_k: Number of results to return
            
        Returns:
            List of dictionaries with text content and score
        """
        logger.info(f"Searching for query in project_id={project_id}")
        index_name = f"rag:{project_id}"
        
        try:
            # Check if index exists
            self.redis.ft(index_name).info()
        except Exception as e:
            logger.warning(f"Index {index_name} does not exist: {e}")
            return []
            
        try:
            # Embed the query
            query_embedding = self.vectorizer.embed(query, as_buffer=True)
            
            # Perform vector search
            query_string = f"*=>[KNN {top_k} @embedding $query_vector AS score]"
            query_params = {"query_vector": query_embedding}
            
            # Execute search
            results = self.redis.ft(index_name).search(
                query_string,
                query_params=query_params
            ).docs
            
            # Format results
            formatted_results = []
            for doc in results:
                formatted_results.append({
                    "text": doc.content.decode('utf-8') if isinstance(doc.content, bytes) else doc.content,
                    "score": float(doc.score) if hasattr(doc, 'score') else 1.0,
                    "id": doc.id
                })
                
            logger.info(f"Found {len(formatted_results)} results for query in project_id={project_id}")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching index {index_name}: {e}")
            return []


# Global indexer instance
indexer = DocumentVectorIndexer()
