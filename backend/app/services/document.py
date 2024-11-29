from typing import AsyncGenerator, List, Optional
from uuid import UUID
from langchain.chat_models import ChatAnthropic
from langchain.schema import AIMessage, HumanMessage, SystemMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter
from .supabase import get_supabase_client
from .redis import get_redis_client

class DocumentService:
    def __init__(self):
        self.model = ChatAnthropic(
            model="claude-2.1",
            anthropic_api_key="your-api-key",
            temperature=0.3,
            streaming=True
        )
        self.supabase = get_supabase_client()
        self.redis = get_redis_client()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    async def generate_document(self, query: str, document_type: str):
        """Generate a new document based on the query."""
        try:
            messages = [
                SystemMessage(content=f"""Generate a professional {document_type} based on the requirements.
                Follow standard legal formatting and include all necessary sections.
                Use clear and precise legal language."""),
                HumanMessage(content=query)
            ]

            response = await self.model.agenerate(messages)
            content = response.generations[0].text

            # Create document in database
            document = await self.create_document(
                title=f"Generated {document_type}",
                content=content,
                document_type=document_type,
                metadata={
                    "generated": True,
                    "prompt": query
                }
            )

            return document

        except Exception as e:
            raise Exception(f"Error generating document: {str(e)}")

    async def analyze_document(self, document_id: str, query: str) -> AsyncGenerator[str, None]:
        """Analyze a document and stream the analysis."""
        try:
            # Get document chunks
            chunks = await self.get_document_chunks(document_id)
            
            messages = [
                SystemMessage(content="""Analyze the provided document segments.
                Focus on legal implications, risks, and key points.
                Provide a structured analysis with clear sections."""),
                HumanMessage(content=f"""
                Document segments:
                {chunks}
                
                Analysis query: {query}""")
            ]

            async for chunk in self.model.astream(messages):
                if isinstance(chunk, AIMessage):
                    yield chunk.content
                else:
                    yield chunk

        except Exception as e:
            yield f"Error analyzing document: {str(e)}"

    async def compare_documents(self, query: str, document_ids: List[str]) -> AsyncGenerator[str, None]:
        """Compare multiple documents and stream the comparison."""
        try:
            # Get documents
            documents = []
            for doc_id in document_ids:
                chunks = await self.get_document_chunks(doc_id)
                documents.append(chunks)

            messages = [
                SystemMessage(content="""Compare the provided documents.
                Highlight key differences and similarities.
                Focus on legal implications and important variations."""),
                HumanMessage(content=f"""
                Document 1:
                {documents[0]}

                Document 2:
                {documents[1]}

                Comparison query: {query}""")
            ]

            async for chunk in self.model.astream(messages):
                if isinstance(chunk, AIMessage):
                    yield chunk.content
                else:
                    yield chunk

        except Exception as e:
            yield f"Error comparing documents: {str(e)}"

    async def modify_document(self, document_id: str, query: str):
        """Modify an existing document based on the query."""
        try:
            # Get original document
            document = await self.get_document(document_id)
            
            messages = [
                SystemMessage(content="""Modify the provided document based on the requirements.
                Maintain consistent style and formatting.
                Ensure all changes are clearly marked."""),
                HumanMessage(content=f"""
                Original document:
                {document['content']}
                
                Requested changes:
                {query}""")
            ]

            response = await self.model.agenerate(messages)
            modified_content = response.generations[0].text

            # Create new version
            version = await self.create_document_version(
                document_id=document_id,
                content=modified_content,
                comment=query
            )

            # Update document content
            await self.update_document(
                document_id=document_id,
                content=modified_content
            )

            return {
                **document,
                "content": modified_content,
                "metadata": {
                    **document["metadata"],
                    "last_modified": version["created_at"],
                    "last_modification": query
                }
            }

        except Exception as e:
            raise Exception(f"Error modifying document: {str(e)}")

    # Database operations
    async def create_document(self, title: str, content: str, document_type: str, metadata: dict):
        """Create a new document in the database."""
        try:
            # Get embedding for content
            embedding = await self.model.embeddings.aembed_query(content)

            response = await self.supabase.table("documents").insert({
                "title": title,
                "content": content,
                "type": document_type,
                "metadata": metadata,
                "embedding": embedding
            }).execute()

            if response.error:
                raise Exception(response.error.message)

            document = response.data[0]

            # Create chunks for vector search
            chunks = self.text_splitter.split_text(content)
            chunk_embeddings = await self.model.embeddings.aembed_documents(chunks)

            # Store chunks
            chunk_data = [
                {
                    "document_id": document["id"],
                    "content": chunk,
                    "embedding": embedding,
                    "metadata": {
                        "index": i,
                        "total_chunks": len(chunks)
                    }
                }
                for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings))
            ]

            await self.supabase.table("document_chunks").insert(chunk_data).execute()

            return document

        except Exception as e:
            raise Exception(f"Error creating document: {str(e)}")

    async def get_document(self, document_id: str):
        """Get a document by ID."""
        try:
            response = await self.supabase.table("documents").select("*").eq("id", document_id).single().execute()
            
            if response.error:
                raise Exception(response.error.message)

            return response.data

        except Exception as e:
            raise Exception(f"Error getting document: {str(e)}")

    async def get_document_chunks(self, document_id: str):
        """Get document chunks for a document."""
        try:
            response = await self.supabase.table("document_chunks").select("content").eq("document_id", document_id).order("metadata->index").execute()
            
            if response.error:
                raise Exception(response.error.message)

            return "\n".join(chunk["content"] for chunk in response.data)

        except Exception as e:
            raise Exception(f"Error getting document chunks: {str(e)}")

    async def create_document_version(self, document_id: str, content: str, comment: Optional[str] = None):
        """Create a new document version."""
        try:
            response = await self.supabase.table("document_versions").insert({
                "document_id": document_id,
                "content": content,
                "comment": comment
            }).execute()

            if response.error:
                raise Exception(response.error.message)

            return response.data[0]

        except Exception as e:
            raise Exception(f"Error creating document version: {str(e)}")

    async def update_document(self, document_id: str, content: str):
        """Update a document's content."""
        try:
            response = await self.supabase.table("documents").update({
                "content": content,
                "updated_at": "now()"
            }).eq("id", document_id).execute()

            if response.error:
                raise Exception(response.error.message)

            return response.data[0]

        except Exception as e:
            raise Exception(f"Error updating document: {str(e)}") 