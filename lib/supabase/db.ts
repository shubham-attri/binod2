import { supabase } from './client'
import type { Database } from './types'

export async function createConversation(title: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addMessage(
  conversation_id: string,
  role: 'user' | 'assistant',
  content: string,
  thinking_steps?: string[],
  file?: File
) {
  let fileData;
  if (file) {
    fileData = await uploadFile(file);
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      role,
      content,
      thinking_steps: thinking_steps ? JSON.stringify(thinking_steps) : null,
      file_url: fileData?.url,
      file_name: fileData?.name,
      file_type: fileData?.type
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getConversation(id: string) {
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select()
    .eq('id', id)
    .single()

  if (conversationError) throw conversationError

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select()
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (messagesError) throw messagesError

  return {
    ...conversation,
    messages
  }
}

export async function deleteMessagesAfter(conversationId: string, messageId: string) {
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('created_at')
    .eq('id', messageId)
    .single();

  if (messageError) throw messageError;

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId)
    .gt('created_at', message.created_at);

  if (error) throw error;
}

export async function uploadFile(file: File) {
  const fileName = `${crypto.randomUUID()}-${file.name}`;
  
  const { data, error } = await supabase
    .storage
    .from('chat-files')
    .upload(fileName, file);

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase
    .storage
    .from('chat-files')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    name: file.name,
    type: file.type
  };
} 