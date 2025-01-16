"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateConversationTitle } from "@/lib/supabase/db";
import { toast } from "sonner";

interface EditConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: {
    id: string;
    title: string;
  };
  onUpdate: () => void;
}

export function EditConversationDialog({
  open,
  onOpenChange,
  conversation,
  onUpdate,
}: EditConversationDialogProps) {
  const [title, setTitle] = useState(conversation.title);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateConversationTitle(conversation.id, title);
      onUpdate();
      onOpenChange(false);
      toast.success("Conversation updated");
    } catch (error) {
      toast.error("Failed to update conversation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Conversation</DialogTitle>
          <DialogDescription>
            Change the title of this conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Conversation title"
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 