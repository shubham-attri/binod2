"use client";

import { useState } from "react";
import { FileText, Upload, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { documentService } from '@/lib/document-service'
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
  size: number;
}

export function DocumentPanel({ caseId }: { caseId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const userId = 'test-user' // Replace with actual user ID from auth
      const document = await documentService.uploadDocument(files[0], caseId, userId);
      
      setDocuments(prev => [...prev, document]);
      toast.success('Document uploaded successfully');
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Failed to upload document', {
        description: 'Please try again later'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: Document) => {
    try {
      await documentService.deleteDocument(document.id, document.content);
      setDocuments(prev => prev.filter(d => d.id !== document.id));
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document', {
        description: 'Please try again later'
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <SheetTitle>Documents</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              aria-label="Upload document"
            />
            <Label htmlFor="file-upload">
              <Button
                className="w-full cursor-pointer"
                disabled={uploading}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </span>
              </Button>
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                "transition-colors hover:bg-accent",
                "group relative"
              )}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.size ? new Intl.NumberFormat("en-US", {
                        style: "unit",
                        unit: "byte",
                        unitDisplay: "narrow",
                      }).format(doc.size) : "Size unknown"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/90"
                  onClick={() => {
                    handleDelete(doc);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete document</span>
                </Button>
              </CardContent>
            </Card>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 