"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Star, 
  Pencil, 
  Trash2,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { updateConversationTitle, deleteConversation, toggleConversationFavorite } from "@/lib/supabase/db";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { EditConversationDialog } from "@/components/history/edit-conversation-dialog";

interface HistoryItemProps {
  conversation: {
    id: string;
    title: string;
    is_favorite: boolean;
  };
  lastActivity: string;
  onUpdate: () => void;
}

export function HistoryItem({ conversation, lastActivity, onUpdate }: HistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [isFavorite, setIsFavorite] = useState(conversation.is_favorite);

  const handleDelete = async () => {
    try {
      await deleteConversation(conversation.id);
      onUpdate();
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleFavorite = async () => {
    try {
      await toggleConversationFavorite(conversation.id, !isFavorite);
      setIsFavorite(!isFavorite);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  const handleSave = async (newTitle: string) => {
    try {
      await updateConversationTitle(conversation.id, newTitle);
      setTitle(newTitle);
      onUpdate(); // Refresh history list
      toast.success("Title updated");
    } catch (error) {
      toast.error("Failed to update title");
    }
  };

  return (
    <div className="group relative bg-muted/50 hover:bg-muted rounded-lg p-4 transition-colors max-w-3xl mx-auto">
      <Link href={`/chat?id=${conversation.id}`} className="block">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{conversation.id.slice(0, 8)}</span>
                <span>•</span>
                <span>{lastActivity}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleFavorite}
        >
          <Star 
            className={cn(
              "h-4 w-4",
              isFavorite && "fill-yellow-400 text-yellow-400"
            )} 
          />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this conversation?")) {
                  handleDelete();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditConversationDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        conversation={conversation}
        onUpdate={onUpdate}
      />
    </div>
  );
} 