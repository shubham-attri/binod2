export type AgentMode = "research" | "case" | "playground";

export interface AgentContext {
  mode: AgentMode;
  userId: string;
  sessionId: string;
  caseId?: string;
  researchId?: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentMemory {
  shortTerm: AgentMessage[];
  longTerm: {
    cases: Record<string, any>[];
    research: Record<string, any>[];
  };
}

export interface AgentState {
  context: AgentContext;
  memory: AgentMemory;
  isProcessing: boolean;
  error?: Error;
}

export interface AgentAction {
  type: string;
  payload: any;
}

export interface AgentResponse {
  message: AgentMessage;
  actions?: AgentAction[];
  context?: Partial<AgentContext>;
}

export interface AgentConfig {
  maxContextLength: number;
  maxResponseTokens: number;
  temperature: number;
  modelName: string;
  embedModelName: string;
} 