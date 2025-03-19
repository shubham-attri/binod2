"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/utils";
import { 
  Paperclip, 
  CornerUpRight, 
  Loader2, 
  X, 
  Globe2,
  Brain, 
  Search 
} from "lucide-react";
import { uploadFile } from "@/lib/supabase/db";
import { toast } from "sonner";

interface ChatInputProps {
  onSubmit: (message: string, files?: File[]) => Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isProcessing?: boolean;
}

type ChatMode = 'agentic' | 'research';

export function ChatInput({ 
  onSubmit, 
  placeholder = "Message...", 
  className,
  disabled,
  isProcessing 
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('agentic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getPlaceholder = () => {
    if (isProcessing) return "Processing...";
    return mode === 'agentic' ? "Message Binod in agentic mode..." : "Message Binod in research mode...";
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'; // Reset to min-height
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;

    try {
      await onSubmit(input, files.length > 0 ? files : undefined);
      setInput("");
      setFiles([]);
      resetTextareaHeight(); // Reset height after submission
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 5 * 24)}px`;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;
    
    // Check if adding new files would exceed the 5 file limit
    if (files.length + selectedFiles.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }

    // Check each file's size (10MB limit)
    const invalidFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("Some files exceed the 10MB limit");
      return;
    }

    try {
      setIsUploading(true);
      setFiles(prev => [...prev, ...selectedFiles]);
      toast.success(`${selectedFiles.length} file(s) attached`);
    } catch (error) {
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
        if (files.length >= 5) {
          toast.error("Maximum 5 files allowed");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB");
          return;
        }
        setFiles(prev => [...prev, file]);
        toast.success("Image attached");
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative space-y-2", className)}>
      {files.length > 0 && (
        <div className="bg-muted p-2 rounded-md">
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background/50 p-1 rounded-md">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="h-6 w-6 object-cover rounded"
                  />
                ) : (
                  <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center">
                    <Paperclip className="h-3 w-3 text-primary" />
                  </div>
                )}
                <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="border-2 border-border/80 rounded-xl overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={adjustTextareaHeight}
            onPaste={handlePaste}
            placeholder={getPlaceholder()}
            className={cn(
              "resize-none py-2 px-3 min-h-[44px] max-h-[120px] text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
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

          <div className="flex items-center justify-end gap-3 p-2  border-border/80 bg-background/50">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl hover:bg-primary/5",
                mode === 'research' && "text-blue-500 bg-blue-500/5 hover:bg-blue-500/10"
              )}
              onClick={() => setMode(mode === 'agentic' ? 'research' : 'agentic')}
              disabled={disabled || isProcessing}
              title={mode === 'agentic' ? "Switch to Research Mode" : "Switch to Agentic Mode"}
            >
              {mode === 'agentic' ? (
                <Brain className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-primary/5"
              disabled={disabled || isProcessing}
              title="Web Search"
            >
              <Globe2 className="h-5 w-5 text-muted-foreground" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-primary/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isProcessing || isUploading || files.length >= 5}
              title={files.length >= 5 ? "Maximum files reached" : "Attach files"}
            >
              <Paperclip className={cn(
                "h-5 w-5",
                files.length >= 5 ? "text-muted-foreground/50" : "text-muted-foreground"
              )} />
            </Button>

            <Button
              type="submit"
              variant="secondary"
              size="icon"
              className={cn(
                "h-9 w-9 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors",
                isProcessing && "animate-pulse"
              )}
              disabled={(!input.trim() && files.length === 0) || disabled || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CornerUpRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
        
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
        multiple
      />
    </form>
  );
} 