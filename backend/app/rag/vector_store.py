import os
from langchain.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores.redis import Redis as RedisVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain.schema import Document
from typing import List, Dict, Any, Optional
import json
from loguru import logger
import tempfile

# Initialize embeddings model
embeddings = OpenAIEmbeddings(
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# Redis connection details
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

class VectorStore:
    """Vector store for RAG using Redis"""
    
    def __init__(self, index_name: str = "legal_docs"):
        """Initialize the vector store"""
        self.index_name = index_name
        try:
            # Try to connect to an existing index
            self.vector_store = RedisVectorStore.from_existing_index(
                embedding=embeddings,
                redis_url=redis_url,
                index_name=index_name
            )
            logger.info(f"Connected to existing Redis vector index: {index_name}")
        except Exception as e:
            # If the index doesn't exist, create a new one
            logger.warning(f"Error connecting to existing index: {e}")
            logger.info(f"Creating new Redis vector index: {index_name}")
            self.vector_store = RedisVectorStore.from_documents(
                documents=[],  # Empty initial documents
                embedding=embeddings,
                redis_url=redis_url,
                index_name=index_name
            )
    
    def ingest_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Ingest text into the vector store"""
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200
        )
        
        # Create a document
        document = Document(page_content=text, metadata=metadata or {})
        
        # Split the document
        splits = text_splitter.split_documents([document])
        
        # Add to vector store
        self.vector_store.add_documents(splits)
        return len(splits)
    
    def ingest_file(self, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Ingest a file into the vector store"""
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
            
            # Add to vector store
            self.vector_store.add_documents(splits)
            return len(splits)
        except Exception as e:
            logger.error(f"Error ingesting file {file_path}: {e}")
            raise
    
    def ingest_bytes(self, content: bytes, file_type: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Ingest file content as bytes into the vector store"""
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
        filter_dict = {"namespace": namespace} if namespace else None
        return self.vector_store.similarity_search(
            query, 
            k=k,
            filter=filter_dict
        )
    
    def similarity_search_with_score(self, query: str, k: int = 5, namespace: Optional[str] = None) -> List[tuple[Document, float]]:
        """Search for similar documents in the vector store with scores"""
        filter_dict = {"namespace": namespace} if namespace else None
        return self.vector_store.similarity_search_with_score(
            query, 
            k=k,
            filter=filter_dict
        )

# Create a singleton instance
vector_store = VectorStore() 