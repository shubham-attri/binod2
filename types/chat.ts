export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  metadata?: {
    operationType?: string;
    documentId?: string;
    documentType?: string;
  };
}

export interface ChatRequest {
  messages: Message[];
  documentId?: string;
}

export interface ChatResponse {
  content: string;
  documentCreated?: boolean;
  documentContent?: string;
} 