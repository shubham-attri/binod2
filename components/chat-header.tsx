"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Pencil, Check } from "lucide-react";
import { updateConversationTitle } from "@/lib/supabase/db";

interface ChatHeaderProps {
  conversationId: string;
  initialTitle: string;
}

export function ChatHeader({ conversationId, initialTitle }: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [tempTitle, setTempTitle] = useState(initialTitle);

  useEffect(() => {
    // Truncate initial title if it's too long
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
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
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
  );
} 