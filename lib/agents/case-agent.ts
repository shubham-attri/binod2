import { BaseAgent } from './base-agent';
import { AgentMessage, AgentResponse, AgentAction } from './types';
import { searchDocuments } from '../services/vector-store';
import { generateResponse } from '../services/ai';
import { getCaseDetails, updateCaseTimeline } from '../services/case-management';

export class CaseAgent extends BaseAgent {
  protected async processMessage(message: AgentMessage): Promise<AgentResponse> {
    // Get case context
    const caseDetails = await this.getCaseContext();
    
    // Analyze message intent
    const intent = await this.analyzeIntent(message, caseDetails);
    
    // Process based on intent
    let response: AgentResponse;
    switch (intent.type) {
      case 'DOCUMENT_REQUEST':
        response = await this.handleDocumentRequest(message, caseDetails);
        break;
      case 'TIMELINE_QUERY':
        response = await this.handleTimelineQuery(message, caseDetails);
        break;
      case 'LEGAL_ANALYSIS':
        response = await this.handleLegalAnalysis(message, caseDetails);
        break;
      case 'ACTION_RECOMMENDATION':
        response = await this.handleActionRecommendation(message, caseDetails);
        break;
      default:
        response = await this.handleGeneralQuery(message, caseDetails);
    }
    
    // Update case timeline
    await this.updateTimeline(message, response);
    
    return response;
  }

  private async getCaseContext(): Promise<any> {
    if (!this.state.context.caseId) {
      throw new Error('No case ID in context');
    }
    return getCaseDetails(this.state.context.caseId);
  }

  private async analyzeIntent(
    message: AgentMessage,
    caseDetails: any
  ): Promise<{ type: string; confidence: number }> {
    const prompt = `Analyze the intent of this message in the context of case management:
    
Message: ${message.content}

Case Type: ${caseDetails.type}
Current Stage: ${caseDetails.stage}

Classify as one of:
- DOCUMENT_REQUEST
- TIMELINE_QUERY
- LEGAL_ANALYSIS
- ACTION_RECOMMENDATION
- GENERAL_QUERY

Return as JSON with type and confidence score.`;

    const result = await generateResponse(prompt, this.config);
    return JSON.parse(result);
  }

  private async handleDocumentRequest(
    message: AgentMessage,
    caseDetails: any
  ): Promise<AgentResponse> {
    // Search case-specific documents
    const documents = await searchDocuments([
      message.content,
      caseDetails.type,
      caseDetails.id
    ]);
    
    const response = await generateResponse(`
      Based on the document request: "${message.content}"
      And the available documents: ${documents.map(d => d.title).join(', ')}
      Provide a summary of relevant documents and their locations.
    `, this.config);
    
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: {
          documents: documents.map(doc => doc.id)
        }
      },
      actions: [{
        type: 'HIGHLIGHT_DOCUMENTS',
        payload: { documentIds: documents.map(doc => doc.id) }
      }]
    };
  }

  private async handleTimelineQuery(
    message: AgentMessage,
    caseDetails: any
  ): Promise<AgentResponse> {
    const timeline = caseDetails.timeline || [];
    
    const response = await generateResponse(`
      Analyze the following timeline events for the query: "${message.content}"
      
      Timeline:
      ${timeline.map(event => `${event.date}: ${event.description}`).join('\n')}
      
      Provide a focused response addressing the specific timeline query.
    `, this.config);
    
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: { timelineEvents: timeline.map(event => event.id) }
      }
    };
  }

  private async handleLegalAnalysis(
    message: AgentMessage,
    caseDetails: any
  ): Promise<AgentResponse> {
    // Get relevant case law and documents
    const documents = await searchDocuments([
      message.content,
      caseDetails.type,
      'precedent'
    ]);
    
    const response = await generateResponse(`
      Provide legal analysis for: "${message.content}"
      
      Case Context:
      Type: ${caseDetails.type}
      Stage: ${caseDetails.stage}
      Key Facts: ${caseDetails.keyFacts}
      
      Relevant Precedents:
      ${documents.map(doc => doc.content).join('\n\n')}
      
      Format as:
      1. Issue Analysis
      2. Applicable Law
      3. Application to Facts
      4. Recommendation
    `, this.config);
    
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: {
          analysis: {
            caseType: caseDetails.type,
            stage: caseDetails.stage,
            precedents: documents.map(doc => doc.id)
          }
        }
      }
    };
  }

  private async handleActionRecommendation(
    message: AgentMessage,
    caseDetails: any
  ): Promise<AgentResponse> {
    const response = await generateResponse(`
      Recommend actions for: "${message.content}"
      
      Case Context:
      Stage: ${caseDetails.stage}
      Deadline: ${caseDetails.nextDeadline}
      Recent Events: ${caseDetails.recentEvents}
      
      Provide:
      1. Immediate Actions
      2. Medium-term Strategy
      3. Risk Assessment
      4. Timeline Considerations
    `, this.config);
    
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      },
      actions: [{
        type: 'SUGGEST_TASKS',
        payload: {
          caseId: caseDetails.id,
          recommendations: response
        }
      }]
    };
  }

  private async handleGeneralQuery(
    message: AgentMessage,
    caseDetails: any
  ): Promise<AgentResponse> {
    const response = await generateResponse(`
      Answer the following query in the context of the current case:
      "${message.content}"
      
      Case Context:
      ${JSON.stringify(caseDetails, null, 2)}
    `, this.config);
    
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
    };
  }

  private async updateTimeline(
    message: AgentMessage,
    response: AgentResponse
  ): Promise<void> {
    if (!this.state.context.caseId) return;
    
    await updateCaseTimeline(this.state.context.caseId, {
      type: 'INTERACTION',
      timestamp: new Date(),
      query: message.content,
      response: response.message.content,
      metadata: response.message.metadata
    });
  }
} 