export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatResponse {
  message: ChatMessage;
}

export interface ApiError {
  message: string;
  status: number;
} 