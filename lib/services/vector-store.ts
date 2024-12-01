import { generateEmbedding } from './ai';
import { AgentConfig } from '../agents/types';

export interface Document {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  document: Document;
  score: number;
}

export async function indexDocument(
  document: Omit<Document, 'embedding'>,
  config: AgentConfig
): Promise<Document> {
  try {
    // Generate embedding for document content
    const embedding = await generateEmbedding(document.content, config);

    // Store document with embedding in Redis
    const response = await fetch('/api/vector-store/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...document,
        embedding,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to index document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error indexing document:', error);
    throw error;
  }
}

export async function searchDocuments(
  query: string[],
  options: {
    limit?: number;
    filters?: Record<string, any>;
    config: AgentConfig;
  }
): Promise<SearchResult[]> {
  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query.join(' '), options.config);

    // Search documents in Redis
    const response = await fetch('/api/vector-store/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embedding: queryEmbedding,
        limit: options.limit || 10,
        filters: options.filters,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/vector-store/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<Omit<Document, 'id' | 'embedding'>>,
  config: AgentConfig
): Promise<Document> {
  try {
    // If content is updated, generate new embedding
    let embedding;
    if (updates.content) {
      embedding = await generateEmbedding(updates.content, config);
    }

    // Update document in Redis
    const response = await fetch(`/api/vector-store/documents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...updates,
        embedding,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
} 