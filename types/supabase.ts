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
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          content: string
          type: 'contract' | 'memo' | 'analysis' | 'other'
          case_id: string
          version: number
          created_at: string
          updated_at: string
          user_id: string
          embedding: number[] | null
          size: number
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: 'contract' | 'memo' | 'analysis' | 'other'
          case_id: string
          version?: number
          created_at?: string
          updated_at?: string
          user_id: string
          embedding?: number[] | null
          size: number
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'contract' | 'memo' | 'analysis' | 'other'
          case_id?: string
          version?: number
          created_at?: string
          updated_at?: string
          user_id?: string
          embedding?: number[] | null
          size?: number
        }
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          version: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          document_id: string
          version?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          document_id?: string
          version?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      chat_threads: {
        Row: {
          id: string
          title: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          thread_id: string
          content: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          thread_id: string
          content: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          thread_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    },
    Functions: {
      search_vault_items: {
        // ... search function types
      },
      get_recent_vault_items: {
        // ... recent items function types
      }
    }
  }
} 