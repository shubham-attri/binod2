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
}

export type Database = {
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
    }
  }
} 