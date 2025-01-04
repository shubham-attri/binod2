"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Document {
  id: string;
  title: string;
  // Add other document properties
}

export function DocumentPanel() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No auth token found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/documents/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch documents');
        console.error('Document fetch failed:', errorData);
      }
    } catch (error) {
      setError('Failed to fetch documents');
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Rest of your component...
} 