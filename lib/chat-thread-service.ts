import { supabase } from './supabase-client'
import type { Database } from '@/types/supabase'

type ChatThread = Database['public']['Tables']['chat_threads']['Row']
type ChatMessage = Database['public']['Tables']['chat_messages']['Row']

export const chatThreadService = {
  async createThread(data: {
    title: string,
    type: 'research' | 'case',
    caseId?: string,
    userId: string,
    initialMessage: string
  }) {
    const { title, type, caseId, userId, initialMessage } = data

    // Start a transaction
    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .insert({
        title,
        type,
        case_id: caseId,
        user_id: userId
      })
      .select()
      .single()

    if (threadError) throw threadError

    // Add initial message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: thread.id,
        role: 'user',
        content: initialMessage,
        user_id: userId
      })

    if (messageError) throw messageError

    return thread
  },

  async getThreads(userId: string, type?: 'research' | 'case') {
    const query = supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (type) {
      query.eq('type', type)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getThreadMessages(threadId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  async addMessage(data: {
    threadId: string,
    content: string,
    role: 'user' | 'assistant',
    userId: string
  }) {
    const { threadId, content, role, userId } = data

    // Add message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        role,
        content,
        user_id: userId
      })

    if (messageError) throw messageError

    // Update thread updated_at
    const { error: threadError } = await supabase
      .from('chat_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)

    if (threadError) throw threadError
  },

  async getCaseThread(caseId: string) {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('case_id', caseId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
    return data
  }
} 