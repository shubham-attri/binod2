"use client";

import { useState } from 'react';
import { uploadFile } from '@/lib/supabase/db';

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      const result = await uploadFile(file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Upload failed'));
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
    error
  };
} 