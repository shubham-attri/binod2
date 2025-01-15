"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, CornerRightUp, Paperclip, X, FileUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FileDisplayProps {
  fileName: string;
  onClear: () => void;
}

function FileDisplay({ fileName, onClear }: FileDisplayProps) {
  return (
    <div className="flex items-center gap-2 bg-background border rounded-md px-2 py-1 text-sm">
      <FileUp className="h-4 w-4" />
      <span className="truncate">{fileName}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-1 p-0.5 rounded-full hover:bg-muted/50"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

interface ChatInputProps {
  onSubmit?: (value: string, file?: File) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  initialValue?: string;
  accept?: string;
  maxFileSize?: number;
}

export function ChatInput({
  onSubmit,
  placeholder = "Message Binod...",
  disabled,
  className,
  minHeight = 56,
  maxHeight = 200,
  initialValue = "",
  accept = "image/*,application/pdf,.doc,.docx,text/*",
  maxFileSize = 5
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue);
  const [height, setHeight] = useState(minHeight);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = (file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`File size must be less than ${maxFileSize}MB`);
      return;
    }
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFileSelect(file);
        break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      setHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleSubmit = () => {
    if (value.trim() || selectedFile) {
      onSubmit?.(value, selectedFile || undefined);
      setValue("");
      clearFile();
      if (textareaRef.current) {
        textareaRef.current.style.height = `${minHeight}px`;
        setHeight(minHeight);
      }
    }
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        {fileName && <FileDisplay fileName={fileName} onClear={clearFile} />}
        <div className="relative flex items-center">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "resize-none overflow-hidden pr-24",
              "min-h-[56px] py-4 px-4",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ height }}
          />

          <div className="absolute right-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 rounded-lg bg-background hover:bg-muted flex items-center justify-center"
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              onClick={handleSubmit}
              disabled={disabled || (!value.trim() && !selectedFile)}
              className={cn(
                "h-8 w-8 rounded-lg bg-background hover:bg-muted flex items-center justify-center",
                "transition-colors",
                (disabled || (!value.trim() && !selectedFile)) && "opacity-50 cursor-not-allowed"
              )}
            >
              {disabled ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CornerRightUp className="h-4 w-4" />
              )}
            </button>
          </div>

          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            accept={accept}
          />
        </div>
      </div>
    </div>
  );
} 