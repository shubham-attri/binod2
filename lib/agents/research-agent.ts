import { BaseAgent } from './base-agent';
import { AgentMessage, AgentResponse, AgentAction } from './types';
import { searchDocuments } from '../services/vector-store';
import { generateResponse } from '../services/ai';

export class ResearchAgent extends BaseAgent {
  protected async processMessage(message: AgentMessage): Promise<AgentResponse> {
    // Extract research intent and keywords
    const keywords = await this.extractKeywords(message.content);
    
    // Search relevant documents
    const documents = await searchDocuments(keywords);
    
    // Generate response using AI
    const response = await this.generateResearchResponse(message, documents);
    
    // Extract and verify citations
    const citations = await this.extractCitations(response);
    
    // Format final response with citations
    const formattedResponse = this.formatResponse(response, citations);
    
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date(),
        metadata: {
          citations,
          documents: documents.map(doc => doc.id)
        }
      },
      actions: this.generateActions(formattedResponse)
    };
  }

  private async extractKeywords(content: string): Promise<string[]> {
    // Use AI to extract relevant keywords for search
    const prompt = `Extract key legal terms and concepts from the following query: "${content}"`;
    const result = await generateResponse(prompt, this.config);
    return JSON.parse(result) as string[];
  }

  private async generateResearchResponse(
    message: AgentMessage,
    documents: any[]
  ): Promise<string> {
    // Combine user query with relevant documents
    const context = documents
      .map(doc => `${doc.title}: ${doc.content}`)
      .join('\n\n');
    
    const prompt = `Based on the following context and the user's query, provide a detailed legal analysis:
    
Query: ${message.content}

Context:
${context}

Provide a well-structured response with:
1. Direct answers to the query
2. Relevant legal principles
3. Supporting case law
4. Practical implications`;

    return generateResponse(prompt, this.config);
  }

  private async extractCitations(response: string): Promise<any[]> {
    // Extract and verify legal citations from the response
    const prompt = `Extract all legal citations from the following text and verify their accuracy:
    
${response}

Return as JSON array with format:
{
  "citation": "full citation text",
  "type": "case|statute|regulation",
  "verified": boolean
}`;

    const result = await generateResponse(prompt, this.config);
    return JSON.parse(result);
  }

  private formatResponse(response: string, citations: any[]): string {
    // Format response with proper citation markers and footnotes
    let formattedResponse = response;
    
    citations.forEach((citation, index) => {
      const marker = `[${index + 1}]`;
      formattedResponse = formattedResponse.replace(
        citation.citation,
        `${citation.citation}${marker}`
      );
    });
    
    // Add footnotes
    const footnotes = citations
      .map((citation, index) => `[${index + 1}] ${citation.citation}`)
      .join('\n');
    
    return `${formattedResponse}\n\nCitations:\n${footnotes}`;
  }

  private generateActions(response: string): AgentAction[] {
    const actions: AgentAction[] = [];
    
    // Add save action if response contains important information
    if (response.length > 500) {
      actions.push({
        type: 'SAVE_RESEARCH',
        payload: {
          content: response,
          timestamp: new Date()
        }
      });
    }
    
    // Add citation export action if citations present
    if (response.includes('[1]')) {
      actions.push({
        type: 'EXPORT_CITATIONS',
        payload: {
          format: 'bluebook'
        }
      });
    }
    
    return actions;
  }
} 