"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, FileText } from "lucide-react";
import { DocumentSheet } from "@/components/shared/document-sheet";
import { toggleConversationFavorite } from "@/lib/supabase/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils/utils";
import { Document } from "@/lib/supabase/types";

interface ChatHeaderProps {
  conversationId: string;
  title: string;
  isFavorite: boolean;
  documents?: Document[];
  onDocumentsUpdate?: (documents: Document[]) => void;
  onTitleUpdate: (title: string) => void;
}

export function ChatHeader({ 
  conversationId, 
  title,
  isFavorite,
  documents = [],
  onDocumentsUpdate,
  onTitleUpdate
}: ChatHeaderProps) {
  const [showDocuments, setShowDocuments] = useState(false);
  const [isStarred, setIsStarred] = useState(isFavorite);

  useEffect(() => {
    setIsStarred(isFavorite);
  }, [isFavorite]);

  const handleFavorite = async () => {
    try {
      await toggleConversationFavorite(conversationId, !isStarred);
      setIsStarred(!isStarred);
      toast.success(isStarred ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-background font-sans">
      <h1 className="text-sm font-medium truncate flex-1">{title}</h1>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleFavorite}
        >
          <Star 
            className={cn(
              "h-4 w-4",
              isStarred && "fill-yellow-400 text-yellow-400"
            )} 
          />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          onClick={() => setShowDocuments(!showDocuments)}
        >
          <FileText className="h-4 w-4" />
          {documents.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </div>

      <DocumentSheet 
        conversationId={conversationId}
        documents={documents as Document[]} // Cast documents to the correct type
        open={showDocuments}
        onOpenChange={setShowDocuments}
        onDocumentsUpdate={onDocumentsUpdate as (documents: Document[]) => void} // Cast onDocumentsUpdate to the correct type
      />
    </div>
  );
} 