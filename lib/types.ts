export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  user_id: string;
  mode: 'research' | 'case';
  case_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
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

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  case_id?: string;
  chat_session_id?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export type CaseStatus = 'active' | 'closed' | 'archived' | 'pending';

export interface Case {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export type ActivityType = 'created' | 'updated' | 'document_added' | 'message_sent' | 'status_changed';

export interface CaseActivity {
  id: string;
  case_id: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
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
  id: string;
  email: string;
  is_active: boolean;
} 