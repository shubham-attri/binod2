"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export function DocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('Document uploaded successfully', {
        description: file.name,
        action: {
          label: 'Dismiss',
          onClick: () => console.log('Dismissed')
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document', {
        description: 'Please try again later',
        action: {
          label: 'Retry',
          onClick: () => document.getElementById('file-upload')?.click()
        }
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileUpload}
        disabled={isUploading || !user}
        accept=".pdf,.doc,.docx,.txt"
      />
      <label htmlFor="file-upload">
        <Button
          variant="outline"
          disabled={isUploading || !user}
          className="cursor-pointer w-full"
          asChild
        >
          <span>
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Document"}
          </span>
        </Button>
      </label>
    </div>
  );
} 