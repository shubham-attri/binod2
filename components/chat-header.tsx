"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Pencil, Check, FileText } from "lucide-react";
import { updateConversationTitle } from "@/lib/supabase/db";
import { DocumentSheet } from "./document-sheet";

interface ChatHeaderProps {
  conversationId: string;
  initialTitle: string;
  hasAttachments?: boolean;
  documents?: Document[];
  onDocumentsUpdate?: (documents: Document[]) => void;
}

export function ChatHeader({ 
  conversationId, 
  initialTitle, 
  hasAttachments,
  documents = [],
  onDocumentsUpdate
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [tempTitle, setTempTitle] = useState(initialTitle);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    const truncatedTitle = initialTitle.length > 30 
      ? initialTitle.slice(0, 30) + "..."
      : initialTitle;
    setTitle(truncatedTitle);
    setTempTitle(truncatedTitle);
  }, [initialTitle]);

  const handleSave = async () => {
    try {
      await updateConversationTitle(conversationId, tempTitle);
      setTitle(tempTitle);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update title:", error);
      setTempTitle(title);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-background font-sans">
      <div className="flex items-center gap-2">
        {/* Title editing section */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="max-w-md font-sans text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setTempTitle(title);
                  setIsEditing(false);
                }
              }}
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="h-8 w-8"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium">{title}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Document Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={() => setShowDocuments(!showDocuments)}
      >
        <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        {documents.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        )}
      </Button>

      {/* Document Sheet */}
      <DocumentSheet 
        conversationId={conversationId}
        documents={documents}
        open={showDocuments}
        onOpenChange={setShowDocuments}
        onDocumentsUpdate={onDocumentsUpdate}
      />
    </div>
  );
} 