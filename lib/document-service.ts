import { supabase } from './supabase-client'
import type { Database } from '@/types/supabase'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']

export const documentService = {
  // ... existing methods ...

  async uploadDocument(file: File, caseId: string, userId: string): Promise<Document> {
    const fileName = `${caseId}/${Date.now()}-${file.name}`
    
    // Upload file to storage
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('case-documents')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError

    // Get file URL
    const { data: { publicUrl: fileUrl } } = supabase.storage
      .from('case-documents')
      .getPublicUrl(fileName)

    // Create document record
    const documentData: DocumentInsert = {
      title: file.name,
      case_id: caseId,
      user_id: userId,
      type: this.getDocumentType(file.name),
      content: fileUrl,
      size: file.size,
    }

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (dbError) throw dbError
    return document
  },

  async deleteDocument(id: string, fileName: string) {
    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('case-documents')
      .remove([fileName])
    
    if (storageError) throw storageError

    // Delete document record
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError
  },

  getDocumentType(fileName: string): 'contract' | 'memo' | 'analysis' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return 'contract'
      case 'doc':
      case 'docx': return 'memo'
      default: return 'other'
    }
  }
} 