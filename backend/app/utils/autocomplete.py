import json
import os
from typing import List, Dict, Any, Optional
from loguru import logger
from ..utils.redis_client import redis_client
import hashlib
import time

try:
    from langchain.embeddings import OpenAIEmbeddings
    embeddings_model = OpenAIEmbeddings(
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    has_embeddings = True
except Exception as e:
    logger.warning(f"OpenAI embeddings not available: {e}")
    has_embeddings = False

class AutocompleteService:
    """Autocomplete service using Redis for caching suggestions"""
    
    def __init__(self):
        """Initialize the autocomplete service"""
        self.prefix_key = "autocomplete:prefix:"
        self.vector_key = "autocomplete:vector:"
        self.category_key = "autocomplete:category:"
    
    def index_phrase(self, phrase: str, context: str = "", category: str = "general") -> str:
        """
        Index a phrase for autocomplete
        
        Args:
            phrase: The phrase to index
            context: Additional context about the phrase
            category: Category for the phrase (e.g., 'legal', 'code', 'general')
            
        Returns:
            str: The phrase ID
        """
        # Create a unique ID for the phrase
        phrase_hash = hashlib.md5(phrase.encode('utf-8')).hexdigest()
        phrase_id = f"phrase:{category}:{phrase_hash}"
        
        # Store basic phrase data
        redis_client.hset(
            phrase_id,
            mapping={
                "text": phrase,
                "context": context,
                "category": category,
                "created_at": str(int(time.time()))
            }
        )
        
        # Store embedding if available
        if has_embeddings:
            try:
                phrase_embedding = embeddings_model.embed_query(phrase)
                redis_client.set(
                    f"{self.vector_key}{phrase_id}",
                    json.dumps(phrase_embedding)
                )
            except Exception as e:
                logger.error(f"Failed to generate embedding for phrase: {e}")
        
        # Add to category index
        redis_client.set(
            f"{self.category_key}{category}:{phrase_hash}",
            phrase_id
        )
        
        # Index prefixes for traditional prefix search
        for i in range(3, len(phrase) + 1):
            prefix = phrase[:i].lower()
            prefix_key = f"{self.prefix_key}{prefix}"
            redis_client.set(
                f"{prefix_key}:{phrase_hash}",
                phrase_id
            )
        
        logger.info(f"Indexed phrase: {phrase} (ID: {phrase_id})")
        return phrase_id
    
    def get_suggestions_by_prefix(
        self, 
        partial_text: str, 
        category: str = "general", 
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get autocomplete suggestions based on prefix matching
        
        Args:
            partial_text: The partial text to complete
            category: Filter suggestions by category
            max_results: Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of suggestion objects
        """
        if len(partial_text) < 3:
            return []
        
        prefix = partial_text.lower()
        prefix_key = f"{self.prefix_key}{prefix}:*"
        
        # Match by prefix pattern
        matches = []
        for key in redis_client.client.scan_iter(match=prefix_key):
            phrase_id = redis_client.get(key.decode('utf-8'))
            if phrase_id:
                phrase_data = redis_client.hgetall(phrase_id)
                if phrase_data.get('category') == category or category == 'all':
                    matches.append({
                        'id': phrase_id,
                        'text': phrase_data.get('text', ''),
                        'context': phrase_data.get('context', ''),
                        'category': phrase_data.get('category', 'general')
                    })
                    
                    if len(matches) >= max_results:
                        break
        
        return matches
    
    def get_suggestions_by_semantic(
        self, 
        partial_text: str, 
        category: str = "general", 
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get autocomplete suggestions based on semantic similarity
        
        Args:
            partial_text: The partial text to complete
            category: Filter suggestions by category
            max_results: Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of suggestion objects
        """
        if not has_embeddings or len(partial_text) < 3:
            return []
        
        # Generate embedding for query
        try:
            query_embedding = embeddings_model.embed_query(partial_text)
        except Exception as e:
            logger.error(f"Failed to generate embedding for query: {e}")
            return []
        
        # Get all phrase IDs for category
        category_pattern = f"{self.category_key}{category}:*"
        if category == 'all':
            category_pattern = f"{self.category_key}*"
            
        # For each phrase, compute similarity
        matches = []
        for key in redis_client.client.scan_iter(match=category_pattern):
            phrase_id = redis_client.get(key.decode('utf-8'))
            if phrase_id:
                # Get embedding
                embedding_json = redis_client.get(f"{self.vector_key}{phrase_id}")
                if embedding_json:
                    phrase_embedding = json.loads(embedding_json)
                    
                    # Compute cosine similarity (dot product for normalized vectors)
                    similarity = sum(a*b for a, b in zip(query_embedding, phrase_embedding))
                    
                    # Get phrase data
                    phrase_data = redis_client.hgetall(phrase_id)
                    
                    matches.append({
                        'id': phrase_id,
                        'text': phrase_data.get('text', ''),
                        'context': phrase_data.get('context', ''),
                        'category': phrase_data.get('category', 'general'),
                        'score': similarity
                    })
        
        # Sort by similarity and return top matches
        matches.sort(key=lambda x: x.get('score', 0), reverse=True)
        return matches[:max_results]
    
    def get_suggestions(
        self, 
        partial_text: str, 
        category: str = "general", 
        max_results: int = 5,
        use_semantic: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get autocomplete suggestions using both prefix and semantic search
        
        Args:
            partial_text: The partial text to complete
            category: Filter suggestions by category
            max_results: Maximum number of results to return
            use_semantic: Whether to include semantic search results
            
        Returns:
            List[Dict[str, Any]]: List of suggestion objects
        """
        # Get prefix matches
        prefix_matches = self.get_suggestions_by_prefix(partial_text, category, max_results)
        
        # If semantic search not enabled or no embeddings, return prefix matches
        if not use_semantic or not has_embeddings:
            return prefix_matches
        
        # Get semantic matches
        semantic_matches = self.get_suggestions_by_semantic(partial_text, category, max_results)
        
        # Merge results (prefix matches first, then semantic unique ones)
        seen_ids = set(match['id'] for match in prefix_matches)
        
        for match in semantic_matches:
            if match['id'] not in seen_ids and len(seen_ids) < max_results:
                prefix_matches.append(match)
                seen_ids.add(match['id'])
        
        return prefix_matches[:max_results]

# Create a singleton instance
autocomplete_service = AutocompleteService() 