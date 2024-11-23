"use client";

import { useState } from "react";
import { X, GripVertical } from "lucide-react";
import { ChatInterface } from "../chat/chat-interface";
import { Button } from "@/components/ui/button";
import { ArtifactView } from "../artifacts/artifact-view";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { motion, AnimatePresence } from "framer-motion";

interface Artifact {
  id: string;
  title: string;
  content: string;
  type: "markdown" | "code";
  createdAt: Date;
  updatedAt: Date;
}

interface ResearchChat {
  id: string;
  title: string;
}

export function ResearchMode() {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [showArtifact, setShowArtifact] = useState(false);
  const [chat, setChat] = useState<ResearchChat>({
    id: Date.now().toString(),
    title: "New Research",
  });

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

  return (
    <div className="flex flex-col h-full">
      {/* Main Content Area */}
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