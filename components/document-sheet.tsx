"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Upload, X, Eye } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { uploadFile, getThreadDocuments, addDocumentToThread, deleteDocument } from "@/lib/supabase/db";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
import { supabase } from "@/lib/supabase/client";

interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  created_at: string;
}

interface DocumentSheetProps {
  conversationId: string;
  documents: Document[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDocumentsUpdate?: (documents: Document[]) => void;
}

export function DocumentSheet({ 
  conversationId, 
  documents = [],
  open,
  onOpenChange,
  onDocumentsUpdate
}: DocumentSheetProps) {
  const [search, setSearch] = useState("");
  const { upload, isUploading } = useFileUpload();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const loadDocuments = async () => {
        try {
          const docs = await getThreadDocuments(conversationId);
          onDocumentsUpdate?.(docs);
        } catch (error) {
          console.error("Failed to load documents:", error);
        }
      };
      loadDocuments();
    }
  }, [open, conversationId, onDocumentsUpdate]);

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (file: File) => {
    try {
      // First upload to storage
      const uploadResult = await uploadFile(file);
      if (!uploadResult?.url) {
        throw new Error("Failed to get upload URL");
      }
      
      // Then add to thread documents
      await addDocumentToThread(conversationId, {
        name: file.name,
        url: uploadResult.url,
        type: file.type
      });

      // Refresh document list
      const updatedDocs = await getThreadDocuments(conversationId);
      onDocumentsUpdate?.(updatedDocs);
      
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      toast.loading("Deleting document...");

      // Get document details
      const doc = documents.find(d => d.id === id);
      if (!doc) {
        toast.error("Document not found");
        return;
      }

      // Delete from storage first
      const fileUrl = new URL(doc.url);
      const filePath = decodeURIComponent(fileUrl.pathname.split('/').pop() || '');
      
      if (filePath) {
        const { error: storageError } = await supabase
          .storage
          .from('chat-files')
          .remove([filePath]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .match({ id });

      if (dbError) throw dbError;

      // Update UI
      const updatedDocs = documents.filter(d => d.id !== id);
      onDocumentsUpdate?.(updatedDocs);

      toast.dismiss();
      toast.success("Document deleted");
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleView = (doc: Document) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Documents</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button 
                size="icon" 
                onClick={() => document.getElementById('doc-upload')?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                type="file"
                id="doc-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted group"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">
                        {formatDate(doc.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          {selectedDoc && (
            <iframe
              src={selectedDoc.url}
              className="w-full h-full rounded-md"
              title={selectedDoc.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 