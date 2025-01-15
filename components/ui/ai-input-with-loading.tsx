"use client";

import { useState, useRef } from "react";
import { Loader2, CornerRightUp, Paperclip, X, FileUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FileDisplayProps {
  fileName: string;
  onClear: () => void;
}

function FileDisplay({ fileName, onClear }: FileDisplayProps) {
  return (
    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 w-fit px-3 py-1 rounded-lg group border dark:border-white/10">
      <FileUp className="w-4 h-4 dark:text-white" />
      <span className="text-sm dark:text-white">{fileName}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-3 h-3 dark:text-white" />
      </button>
    </div>
  );
}

interface AIInputWithLoadingProps {
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

export function AIInputWithLoading({
  onSubmit,
  placeholder = "Message...",
  disabled,
  className,
  minHeight = 56,
  maxHeight = 200,
  initialValue = "",
  accept = "application/pdf,.doc,.docx,text/*",
  maxFileSize = 5
}: AIInputWithLoadingProps) {
  const [value, setValue] = useState(initialValue);
  const [height, setHeight] = useState(minHeight);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File size must be less than ${maxFileSize}MB`);
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

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
      {fileName && <FileDisplay fileName={fileName} onClear={clearFile} />}
      <div className="relative">
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-lg bg-black/5 dark:bg-white/5 hover:cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4 transform scale-x-[-1] rotate-45" />
        </div>

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={accept}
        />

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
            "resize-none overflow-hidden pr-12 pl-10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ height }}
        />

        <button
          onClick={handleSubmit}
          disabled={disabled}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center",
            "hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
            disabled && "opacity-50 cursor-not-allowed",
            (!value.trim() && !selectedFile) && "opacity-50 cursor-not-allowed"
          )}
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CornerRightUp className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}