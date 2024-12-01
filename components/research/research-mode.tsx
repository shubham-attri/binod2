"use client";

import React from "react";
import { ChatInterface } from "../chat/chat-interface";
import { DocumentPanel, type Document } from "./document-panel";
import { useChat } from "../../hooks/use-chat";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ChevronRight, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

export interface ResearchModeProps {}

export function ResearchMode({}: ResearchModeProps) {
  const { messages, sendMessage, isLoading } = useChat();
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDocPanelOpen, setIsDocPanelOpen] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setDocuments([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Replace with actual API call
      const mockDocuments: Document[] = [
        {
          id: "1",
          title: "Contract Agreement Template",
          type: "pdf",
          url: "/documents/contract.pdf",
          excerpt: "Standard contract agreement template with legal terms...",
        },
        {
          id: "2",
          title: "Legal Research Guidelines",
          type: "doc",
          url: "/documents/guidelines.doc",
          excerpt: "Comprehensive guide for conducting legal research...",
        },
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDocuments(mockDocuments);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search documents", {
        description: "An error occurred while searching documents. Please try again."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocumentSelect = async (document: Document) => {
    try {
      // TODO: Replace with actual document content fetching
      const message = `I've selected the document: "${document.title}". Please analyze this document and provide a summary of its key points.`;
      await sendMessage(message);
      toast.success("Document selected", {
        description: `Analyzing "${document.title}". Please wait for the summary.`
      });
    } catch (error) {
      console.error("Document selection error:", error);
      toast.error("Failed to load document", {
        description: "An error occurred while loading the document. Please try again."
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 2000)), // Simulate upload
        {
          loading: "Uploading document...",
          success: `Successfully uploaded ${files[0].name}`,
          error: "Failed to upload document",
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col p-4">
        <ChatInterface
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          className="h-full w-full"
          actions={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Upload document</span>
            </Button>
          }
        />
        {isDocPanelOpen && !isFullscreen && (
          <div className="w-[350px] border-l flex flex-col">
            <div className="h-14 border-b flex items-center justify-between px-4">
              <h2 className="font-medium">Documents</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDocPanelOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DocumentPanel
              documents={[]}
              onDocumentSelect={() => {}}
              isLoading={false}
            />
          </div>
        )}
        <label htmlFor="file-upload" className="sr-only">
          Upload document
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            // Handle file upload
            console.log(e.target.files);
          }}
          accept=".pdf,.doc,.docx,.txt"
          aria-label="Upload document"
          title="Upload document"
        />
      </div>

      <div className={cn(
        "flex transition-all duration-300",
        isPanelCollapsed ? "w-10" : "w-[300px]"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="shrink-0"
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            !isPanelCollapsed && "rotate-180"
          )} />
        </Button>
        {!isPanelCollapsed && (
          <div className="border-l flex-1">
            <ScrollArea className="h-full">
              <DocumentPanel
                documents={documents}
                onSearch={handleSearch}
                onDocumentSelect={handleDocumentSelect}
                isLoading={isSearching}
              />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
} 