import os
from typing import List, Dict, Any, Optional, Tuple
from loguru import logger
import tempfile
import json

# Import RedisVL components
from redisvl.index import SearchIndex
from redisvl.schema import IndexSchema, VectorField, TextField, NumericField, TagField
from redisvl.query import query_index
from redisvl.extensions.langchain import RedisVLVectorStore
from redisvl.utils import timer

# For document handling
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_openai import OpenAIEmbeddings

# Redis connection details
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Initialize embeddings model
try:
    embeddings = OpenAIEmbeddings(
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    has_embeddings = True
    logger.info("OpenAI embeddings initialized")
except Exception as e:
    logger.warning(f"OpenAI embeddings not available: {e}")
    has_embeddings = False

class RedisVLStore:
    """Vector store for RAG using RedisVL"""
    
    def __init__(self, index_name: str = "legal_docs", dimension: int = 1536):
        """Initialize the vector store with RedisVL"""
        self.index_name = index_name
        self.dimension = dimension
        
        # Define schema for the vector index
        self.schema = IndexSchema(
            prefix=index_name, 
            fields=[
                VectorField(
                    name="content_vector", 
                    algorithm="HNSW", 
                    attributes={
                        "TYPE": "FLOAT32", 
                        "DIM": dimension, 
                        "DISTANCE_METRIC": "COSINE"
                    }
                ),
                TextField(name="content"),
                TextField(name="metadata", no_stem=True),
                TagField(name="namespace"),
                NumericField(name="created_at")
            ]
        )
        
        try:
            # Try to connect to an existing index
            self.index = SearchIndex.load(self.index_name)
            logger.info(f"Connected to existing RedisVL index: {index_name}")
        except Exception as e:
            logger.warning(f"Error connecting to existing index: {e}")
            logger.info(f"Creating new RedisVL index: {index_name}")
            
            # Create a new index
            self.index = SearchIndex.create(self.schema)
        
        # Initialize the LangChain integration if embeddings are available
        if has_embeddings:
            self.vector_store = RedisVLVectorStore(
                embedding=embeddings,
                index_name=self.index_name,
                redis_url=REDIS_URL
            )
            logger.info("RedisVLVectorStore initialized with embeddings")
        else:
            self.vector_store = None
            logger.warning("RedisVLVectorStore not initialized (embeddings not available)")
    
    def ingest_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Ingest text into the vector store"""
        if not has_embeddings or not self.vector_store:
            logger.error("Cannot ingest text without embeddings")
            return 0
            
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200
        )
        
        # Create a document
        document = Document(page_content=text, metadata=metadata or {})
        
        # Split the document
        splits = text_splitter.split_documents([document])
        
        with timer() as t:
            # Add to vector store
            self.vector_store.add_documents(splits)
        
        logger.info(f"Ingested {len(splits)} chunks in {t.elapsed:.2f}s")
        return len(splits)
    
    def ingest_file(self, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Ingest a file into the vector store"""
        if not has_embeddings or not self.vector_store:
            logger.error("Cannot ingest file without embeddings")
            return 0
            
        try:
            # Determine loader based on file extension
            if file_path.endswith('.pdf'):
                loader = PyPDFLoader(file_path)
            else:
                loader = TextLoader(file_path)
            
            # Load documents
            documents = loader.load()
            
            # Split text into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, 
                chunk_overlap=200
            )
            splits = text_splitter.split_documents(documents)
            
            # Add metadata if provided
            if metadata:
                for split in splits:
                    split.metadata.update(metadata)
            
            with timer() as t:
                # Add to vector store
                self.vector_store.add_documents(splits)
            
            logger.info(f"Ingested {len(splits)} chunks from {file_path} in {t.elapsed:.2f}s")
            return len(splits)
        except Exception as e:
            logger.error(f"Error ingesting file {file_path}: {e}")
            raise
    
    def ingest_bytes(self, content: bytes, file_type: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Ingest file content as bytes into the vector store"""
        if not has_embeddings or not self.vector_store:
            logger.error("Cannot ingest bytes without embeddings")
            return 0
            
        try:
            # Save to temporary file
            suffix = f".{file_type}" if file_type else ""
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
                temp_file.write(content)
                temp_path = temp_file.name
                
            # Ingest the temporary file
            result = self.ingest_file(temp_path, metadata)
            
            # Clean up
            os.unlink(temp_path)
            return result
        except Exception as e:
            logger.error(f"Error ingesting bytes: {e}")
            raise
    
    def similarity_search(self, query: str, k: int = 5, namespace: Optional[str] = None) -> List[Document]:
        """Search for similar documents in the vector store"""
        if not has_embeddings or not self.vector_store:
            logger.error("Cannot perform similarity search without embeddings")
            return []
            
        # Add filter if namespace is provided
        filter_expr = None
        if namespace:
            filter_expr = f"@namespace:{{{namespace}}}"
        
        # Perform search
        with timer() as t:
            results = self.vector_store.similarity_search(
                query, 
                k=k,
                filter=filter_expr
            )
        
        logger.info(f"Found {len(results)} results in {t.elapsed:.2f}s")
        return results
    
    def similarity_search_with_score(self, query: str, k: int = 5, namespace: Optional[str] = None) -> List[Tuple[Document, float]]:
        """Search for similar documents in the vector store with scores"""
        if not has_embeddings or not self.vector_store:
            logger.error("Cannot perform similarity search without embeddings")
            return []
            
        # Add filter if namespace is provided
        filter_expr = None
        if namespace:
            filter_expr = f"@namespace:{{{namespace}}}"
        
        # Perform search
        with timer() as t:
            results = self.vector_store.similarity_search_with_score(
                query, 
                k=k,
                filter=filter_expr
            )
        
        logger.info(f"Found {len(results)} results with scores in {t.elapsed:.2f}s")
        return results
    
    def raw_query(self, query_str: str, return_fields: Optional[List[str]] = None) -> List[Dict]:
        """Execute a raw query against the vector index"""
        try:
            # Execute raw query
            with timer() as t:
                results = query_index(
                    index_name=self.index_name,
                    query_str=query_str,
                    return_fields=return_fields or ["content", "metadata", "namespace"],
                    limit=10  # Default limit
                )
            
            logger.info(f"Raw query executed in {t.elapsed:.2f}s")
            return results
        except Exception as e:
            logger.error(f"Error executing raw query: {e}")
            return []
    
    def delete_namespace(self, namespace: str) -> bool:
        """Delete all documents in a namespace"""
        try:
            query_str = f"@namespace:{{{namespace}}}"
            
            # Get document IDs in the namespace
            results = self.raw_query(query_str, return_fields=["__id"])
            
            if not results:
                logger.info(f"No documents found in namespace {namespace}")
                return True
            
            # Delete documents from the index
            doc_ids = [doc["__id"] for doc in results]
            self.index.delete_documents(doc_ids)
            
            logger.info(f"Deleted {len(doc_ids)} documents from namespace {namespace}")
            return True
        except Exception as e:
            logger.error(f"Error deleting namespace {namespace}: {e}")
            return False

# Create a singleton instance
vector_store = RedisVLStore() 