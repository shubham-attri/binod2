"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export function DocumentPanel() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${BACKEND_URL}/api/v1/documents/list`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // ... rest of your component
} 