"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

interface DocumentUploadProps {
  mode: 'research' | 'case';
  caseId?: string;
  sessionId?: string;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ mode, caseId, sessionId, onUploadComplete }: DocumentUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      if (caseId) formData.append('case_id', caseId);
      if (sessionId) formData.append('session_id', sessionId);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button 
          disabled={uploading}
          className="cursor-pointer"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </label>
    </div>
  );
} 