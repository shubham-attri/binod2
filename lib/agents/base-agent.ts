import { 
  AgentContext, 
  AgentMessage, 
  AgentMemory, 
  AgentState,
  AgentConfig,
  AgentResponse
} from './types';

export abstract class BaseAgent {
  protected state: AgentState;
  protected config: AgentConfig;

  constructor(context: AgentContext, config: AgentConfig) {
    this.config = config;
    this.state = {
      context,
      memory: {
        shortTerm: [],
        longTerm: {
          cases: [],
          research: []
        }
      },
      isProcessing: false
    };
  }

  protected abstract processMessage(message: AgentMessage): Promise<AgentResponse>;

  public async sendMessage(content: string): Promise<AgentResponse> {
    try {
      this.state.isProcessing = true;

      const message: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date()
      };

      // Add to short-term memory
      this.state.memory.shortTerm.push(message);

      // Process message
      const response = await this.processMessage(message);

      // Add response to memory
      if (response.message) {
        this.state.memory.shortTerm.push(response.message);
      }

      // Update context if provided
      if (response.context) {
        this.state.context = {
          ...this.state.context,
          ...response.context
        };
      }

      return response;
    } catch (error) {
      this.state.error = error as Error;
      throw error;
    } finally {
      this.state.isProcessing = false;
    }
  }

  public getState(): AgentState {
    return this.state;
  }

  public getContext(): AgentContext {
    return this.state.context;
  }

  public getMemory(): AgentMemory {
    return this.state.memory;
  }

  protected async updateMemory(message: AgentMessage): Promise<void> {
    // Add to short-term memory
    this.state.memory.shortTerm.push(message);

    // Trim short-term memory if needed
    if (this.state.memory.shortTerm.length > this.config.maxContextLength) {
      this.state.memory.shortTerm = this.state.memory.shortTerm.slice(
        this.state.memory.shortTerm.length - this.config.maxContextLength
      );
    }
  }

  protected clearMemory(): void {
    this.state.memory.shortTerm = [];
  }

  protected setError(error: Error): void {
    this.state.error = error;
  }

  protected clearError(): void {
    this.state.error = undefined;
  }
} 