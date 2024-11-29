"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "../chat/chat-interface";
import { ArtifactView } from "../artifacts/artifact-view";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { getThread } from "@/lib/chat-service";
import { Message } from "@/types/chat";
import { Artifact } from "@/types/artifacts";
import { AnimatePresence, motion } from "framer-motion";

interface ResearchModeProps {
  threadId?: string;
}

export function ResearchMode({ threadId }: ResearchModeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [showArtifact, setShowArtifact] = useState(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  useEffect(() => {
    const loadThread = async () => {
      if (!threadId) {
        setIsLoading(false);
        return;
      }

      try {
        const thread = await getThread(threadId);
        if (thread) {
          setInitialMessages(thread.messages);
        }
      } catch (error) {
        console.error("Error loading thread:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThread();
  }, [threadId]);

  const handleSubmit = async (input: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: input,
          documentId: selectedArtifact?.id,
          documentType: selectedArtifact?.type
        })
      });

      if (!response.ok) throw new Error("Failed to process query");
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response reader");

      // Process chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Process the chunk and update UI
        const chunk = new TextDecoder().decode(value);
        const data = JSON.parse(chunk);
        
        if (data.document && data.document.id) {
          setSelectedArtifact(data.document);
          setShowArtifact(true);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Failed to upload file");
      
      const document = await response.json();
      setSelectedArtifact(document);
      setShowArtifact(true);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleDocumentSelect = (document: Artifact) => {
    setSelectedArtifact(document);
    setShowArtifact(true);
  };

  const handleCloseArtifact = () => {
    setShowArtifact(false);
    // Add a small delay before removing the artifact to allow animation
    setTimeout(() => setSelectedArtifact(null), 300);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full">
      <AnimatePresence initial={false}>
        {showArtifact && selectedArtifact ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <ChatInterface
                initialMessages={initialMessages}
                isLoading={isGenerating}
                isProcessing={isGenerating}
                selectedDocument={selectedArtifact}
                onSubmit={handleSubmit}
                onFileUpload={handleFileUpload}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ArtifactView
                  artifact={selectedArtifact}
                  onClose={handleCloseArtifact}
                  onSelect={handleDocumentSelect}
                />
              </motion.div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <ChatInterface
              initialMessages={initialMessages}
              isLoading={isGenerating}
              isProcessing={isGenerating}
              selectedDocument={selectedArtifact}
              onSubmit={handleSubmit}
              onFileUpload={handleFileUpload}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 