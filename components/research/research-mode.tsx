"use client";

import { useState, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { ChatInterface } from "../chat/chat-interface";
import { ArtifactView } from "../artifacts/artifact-view";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { motion, AnimatePresence } from "framer-motion";
import { getThread } from "@/lib/chat-service";
import { Message } from "@/types/chat";

interface Artifact {
  id: string;
  title: string;
  content: string;
  type: "markdown" | "code";
  createdAt: Date;
  updatedAt: Date;
}

interface ResearchModeProps {
  threadId?: string;
}

export function ResearchMode({ threadId }: ResearchModeProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [showArtifact, setShowArtifact] = useState(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (threadId) {
      const loadThread = () => {
        const thread = getThread(threadId);
        if (thread) {
          setInitialMessages(thread.messages);
        }
        setIsLoading(false);
      };

      // Delay the localStorage access to ensure client-side execution
      setTimeout(loadThread, 0);
    } else {
      setIsLoading(false);
    }
  }, [threadId]);

  const handleCreateArtifact = () => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      title: "New Document",
      content: "",
      type: "markdown",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedArtifact(newArtifact);
    setShowArtifact(true);
  };

  if (isLoading) {
    return <div>Loading...</div>; // Add a proper loading state here
  }

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel 
          defaultSize={showArtifact ? 40 : 100}
          minSize={30}
          maxSize={70}
        >
          <ChatInterface
            onCreateDocument={handleCreateArtifact}
            showCreateDocument
            selectedDocument={selectedArtifact}
            initialMessages={initialMessages}
          />
        </ResizablePanel>
        
        <AnimatePresence>
          {showArtifact && (
            <>
              <ResizableHandle withHandle>
                <GripVertical className="h-4 w-4" />
              </ResizableHandle>
              <ResizablePanel defaultSize={60}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  {selectedArtifact && (
                    <div className="flex-1">
                      <ArtifactView
                        artifact={selectedArtifact}
                        onUpdate={(content) => {
                          setSelectedArtifact({
                            ...selectedArtifact,
                            content,
                            updatedAt: new Date(),
                          });
                        }}
                        onClose={() => setShowArtifact(false)}
                      />
                    </div>
                  )}
                </motion.div>
              </ResizablePanel>
            </>
          )}
        </AnimatePresence>
      </ResizablePanelGroup>
    </div>
  );
} 