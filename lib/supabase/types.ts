export type Message = {
    id: string
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    thinking_steps?: string[]
    created_at: string
  }
  
  export type Conversation = {
    id: string
    title: string
    created_at: string
    updated_at: string
    is_favorite: boolean
  }
  
  export type Document = {
    id: string
    conversation_id: string
    name: string
    url: string
    type: string
    ingested_chunks: number
    created_at: string
  }
  
  export interface Database {
    public: {
      Tables: {
        conversations: {
          Row: Conversation
          Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
          Update: Partial<Omit<Conversation, 'id'>>
        }
        messages: {
          Row: Message
          Insert: Omit<Message, 'id' | 'created_at'>
          Update: Partial<Omit<Message, 'id'>>
        }
        documents: {
          Row: Document
          Insert: Omit<Document, 'id' | 'created_at'>
          Update: Partial<Omit<Document, 'id'>>
        }
      }
    }
  }

export interface UIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  thinking?: string[];
  files?: File[];
  file_url?: string;
  file_name?: string;
  file_type?: string;
}