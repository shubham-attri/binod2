export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string
          title: string
          client_name: string
          description: string | null
          status: 'active' | 'pending' | 'closed'
          priority: 'high' | 'medium' | 'low'
          tags: string[] | null
          created_at: string
          updated_at: string
          user_id: string
          starred: boolean
        }
        Insert: {
          id?: string
          title: string
          client_name: string
          description?: string | null
          status?: 'active' | 'pending' | 'closed'
          priority?: 'high' | 'medium' | 'low'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          user_id: string
          starred?: boolean
        }
        Update: {
          id?: string
          title?: string
          client_name?: string
          description?: string | null
          status?: 'active' | 'pending' | 'closed'
          priority?: 'high' | 'medium' | 'low'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          user_id?: string
          starred?: boolean
        }
      }
      // ... similar structure for documents, chat_threads, and chat_messages
    }
    Functions: {
      search_vault_items: {
        Args: { search_query: string; user_id: string }
        Returns: {
          id: string
          title: string
          type: string
          created_at: string
          updated_at: string
          starred: boolean
          tags: string[] | null
          case_id: string | null
        }[]
      }
      get_recent_vault_items: {
        Args: { user_id: string; items_limit: number }
        Returns: {
          id: string
          title: string
          type: string
          created_at: string
          updated_at: string
          starred: boolean
          tags: string[] | null
          case_id: string | null
        }[]
      }
    }
  }
} 