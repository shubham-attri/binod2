export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string | Date;
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