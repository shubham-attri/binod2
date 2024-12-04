export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatRequest {
  content: string;
  mode: 'research' | 'case';
  case_id?: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  message: ChatMessage;
  citations?: Array<any>;
  metadata?: Record<string, any>;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  email: string;
  is_active: boolean;
} 