"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Document {
  id: string;
  file_name: string;
  folder_path: string;
  mode: 'research' | 'case';
  created_at: string;
}

interface DocumentListProps {
  mode: 'research' | 'case';
  caseId?: string;
  sessionId?: string;
}

export function DocumentList({ mode, caseId, sessionId }: DocumentListProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        if (!token || !user) {
          console.log('No token or user found');
          return;
        }

        const params = new URLSearchParams();
        if (caseId) params.append('case_id', caseId);
        if (sessionId) params.append('session_id', sessionId);

        const response = await fetch(
          `${BACKEND_URL}/api/v1/documents/list?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [user, caseId, sessionId, mode]);

  if (loading) {
    return <div>Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div 
          key={doc.id}
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-medium">{doc.file_name}</h3>
          <p className="text-sm text-gray-500">
            Folder: {doc.folder_path}
          </p>
          <p className="text-xs text-gray-400">
            Added: {new Date(doc.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
} 