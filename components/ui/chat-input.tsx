"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/utils";
import { Paperclip, CornerUpRight, Loader2, X } from "lucide-react";
import { uploadFile } from "@/lib/supabase/db";
import { toast } from "sonner";

interface ChatInputProps {
  onSubmit: (message: string, file?: File) => Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function ChatInput({ 
  onSubmit, 
  placeholder = "Message...", 
  className,
  disabled,
  isProcessing 
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    try {
      await onSubmit(input, file || undefined);
      setInput("");
      setFile(null);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      try {
        setIsUploading(true);
        setFile(selectedFile);
        toast.success("File attached");
      } catch (error) {
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    const imageItem = Array.from(items || []).find(
      item => item.type.indexOf('image') !== -1
    );

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB");
          return;
        }
        setFile(file);
        toast.success("Image attached");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      {file && (
        <div className="absolute -top-12 left-0 right-0 bg-muted p-2 rounded-md flex items-center gap-2">
          {file.type.startsWith('image/') ? (
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              className="h-8 w-8 object-cover rounded"
            />
          ) : (
            <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center">
              <Paperclip className="h-4 w-4 text-primary" />
            </div>
          )}
          <span className="text-sm truncate flex-1">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="relative flex items-center">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          placeholder={isProcessing ? "Processing..." : placeholder}
          className={cn(
            "resize-none pr-24 py-3 max-h-40",
            "scrollbar-thumb-rounded scrollbar-track-rounded",
            "scrollbar-thin scrollbar-thumb-border",
            isProcessing && "animate-pulse bg-muted/50"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={disabled || isProcessing}
          rows={1}
        />

        <div className="absolute right-2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing || isUploading}
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isProcessing && "animate-pulse"
            )}
            disabled={(!input.trim() && !file) || disabled || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CornerUpRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
        />
      </div>
    </form>
  );
} 