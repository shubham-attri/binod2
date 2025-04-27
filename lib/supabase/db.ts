import { supabase } from './client'
import type { Database, Document } from './types'

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
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
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
  try {
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    
    // Upload file to storage
    const { error: uploadError } = await supabase
      .storage
      .from('chat-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('chat-files')
      .getPublicUrl(fileName);

    if (!publicUrl) throw new Error("Failed to get public URL");

    return {
      url: publicUrl,
      name: file.name,
      type: file.type
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export async function getConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages (
        content,
        role,
        created_at
      )
    `)
    .order('is_favorite', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateConversationTitle(id: string, title: string) {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id);

  if (error) throw error;
}

export async function addDocumentToThread(
  conversation_id: string,
  document: {
    name: string;
    url: string;
    type: string;
  }
): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      conversation_id,
      name: document.name,
      url: document.url,
      type: document.type
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getThreadDocuments(conversation_id: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  // Map storage columns to frontend document shape
  return (data as any[]).map(d => ({
    id: d.id,
    conversation_id: d.conversation_id,
    name: d.file_name,
    url: d.file_url,
    type: d.file_type,
    ingested_chunks: d.ingested_chunks,
    created_at: d.created_at,
  }));
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleConversationFavorite(id: string, isFavorite: boolean) {
  const { error } = await supabase
    .from('conversations')
    .update({ is_favorite: isFavorite })
    .eq('id', id);

  if (error) throw error;
} 