"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api-client";

interface DocumentUploadProps {
  onUploadComplete?: (document: any) => void;
  onUploadError?: (error: Error) => void;
  caseId?: string;
}

export function DocumentUpload({ 
  onUploadComplete, 
  onUploadError,
  caseId 
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setSelectedFile(file);
    setUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const document = await apiClient.uploadDocument(file, caseId);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (onUploadComplete) {
        onUploadComplete(document);
      }
    } catch (error) {
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
      setProgress(0);
      setSelectedFile(null);
    }
  }, [caseId, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${uploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground">
            PDF, DOC, DOCX or TXT (max 10MB)
          </div>
        </div>
      </div>

      {(uploading || selectedFile) && (
        <div className="mt-4 bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4" />
              <span className="text-sm font-medium">
                {selectedFile?.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelUpload}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}
    </div>
  );
} 