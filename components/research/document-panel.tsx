"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentList } from "@/components/documents/document-list";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import type { Document } from "@/lib/types";

interface DocumentPanelProps {
  caseId?: string;
}

export function DocumentPanel({ caseId }: DocumentPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentCount, setDocumentCount] = useState(0);

  useEffect(() => {
    // Load document count on mount
    const loadDocumentCount = async () => {
      try {
        const documents = await apiClient.listDocuments(caseId);
        setDocumentCount(documents.length);
      } catch (error) {
        console.error("Failed to load documents:", error);
      }
    };
    loadDocumentCount();
  }, [caseId]);

  const handleUploadComplete = async (document: Document) => {
    // Update document count
    setDocumentCount(prev => prev + 1);
    // Switch to documents tab
    const docsTab = document.querySelector('[data-tab="documents"]') as HTMLElement;
    if (docsTab) docsTab.click();
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload failed:", error);
    // TODO: Show error toast
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    // TODO: Show document preview
  };

  const handleDocumentDelete = () => {
    // Update document count
    setDocumentCount(prev => Math.max(0, prev - 1));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative flex items-center justify-center hover:bg-accent"
          aria-label="Toggle Documents Panel"
        >
          <FileText className="h-5 w-5" />
          {documentCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {documentCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Documents</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="documents" className="h-full">
          <TabsList className="px-6">
            <TabsTrigger value="documents" data-tab="documents">
              All Documents
              {documentCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {documentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          
          <div className="px-6 py-4">
            <TabsContent value="documents" className="m-0">
              <DocumentList
                caseId={caseId}
                onDocumentSelect={handleDocumentSelect}
                onDocumentDelete={handleDocumentDelete}
              />
            </TabsContent>
            
            <TabsContent value="upload" className="m-0">
              <DocumentUpload
                caseId={caseId}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 