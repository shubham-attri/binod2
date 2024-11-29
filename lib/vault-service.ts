import { supabase } from './supabase-client'
import type { Database } from '@/types/supabase'
import { caseService, documentService } from './case-service'

type VaultItem = {
  id: string
  title: string
  type: 'case' | 'document'
  createdAt: string
  updatedAt: string
  starred?: boolean
  tags?: string[]
  caseId?: string
}

export const vaultService = {
  async getVaultItems(userId: string): Promise<VaultItem[]> {
    // Get both cases and documents
    const [cases, documents] = await Promise.all([
      caseService.getCases(),
      supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
    ])

    if (documents.error) throw documents.error

    // Combine and format cases and documents
    const vaultItems: VaultItem[] = [
      ...(cases?.map(case_ => ({
        id: case_.id,
        title: case_.title,
        type: 'case' as const,
        createdAt: case_.created_at,
        updatedAt: case_.updated_at,
        tags: case_.tags || [],
        starred: false // TODO: Implement starring functionality
      })) || []),
      ...(documents.data?.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: 'document' as const,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        caseId: doc.case_id,
        starred: false // TODO: Implement starring functionality
      })) || [])
    ]

    return vaultItems.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  },

  async searchVaultItems(query: string, userId: string): Promise<VaultItem[]> {
    const { data: searchResults, error } = await supabase
      .rpc('search_vault_items', {
        search_query: query,
        user_id: userId
      })

    if (error) throw error
    return searchResults
  },

  async starItem(itemId: string, itemType: 'case' | 'document', starred: boolean) {
    const table = itemType === 'case' ? 'cases' : 'documents'
    const { error } = await supabase
      .from(table)
      .update({ starred })
      .eq('id', itemId)

    if (error) throw error
  },

  async addTags(itemId: string, itemType: 'case' | 'document', tags: string[]) {
    const table = itemType === 'case' ? 'cases' : 'documents'
    const { error } = await supabase
      .from(table)
      .update({ tags })
      .eq('id', itemId)

    if (error) throw error
  },

  async getRecentItems(userId: string, limit = 5): Promise<VaultItem[]> {
    const { data, error } = await supabase
      .rpc('get_recent_vault_items', {
        user_id: userId,
        items_limit: limit
      })

    if (error) throw error
    return data
  }
} 