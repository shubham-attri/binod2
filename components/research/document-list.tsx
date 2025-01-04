"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
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
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border p-4">
      {documents.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">
          No documents uploaded yet
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-accent"
            >
              <FileIcon className="h-8 w-8 text-blue-500" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">{doc.title}</p>
                <div className="flex text-sm text-muted-foreground">
                  <span>{doc.file_type}</span>
                  <span className="mx-2">•</span>
                  <span>{formatBytes(doc.file_size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
} 