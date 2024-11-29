"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Artifact } from "@/types/artifacts";
import { Upload, Send, Loader2 } from "lucide-react";

interface ChatInterfaceProps {
  initialMessages?: Message[];
  isLoading?: boolean;
  isProcessing?: boolean;
  selectedDocument?: Artifact | null;
  onSubmit: (input: string) => Promise<void>;
  onFileUpload?: (file: File) => Promise<void>;
}

export function ChatInterface({
  initialMessages = [],
  isLoading = false,
  isProcessing = false,
  selectedDocument,
  onSubmit,
  onFileUpload
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      createdAt: new Date(),
      metadata: {
        documentId: selectedDocument?.id,
        documentType: selectedDocument?.type
      }
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      await onSubmit(input);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onFileUpload) return;

    try {
      await onFileUpload(file);
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col flex-1 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 mt-4">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              aria-label="Upload Document"
              title="Upload Document"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Document"
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Input
              placeholder={
                selectedDocument 
                  ? `Ask questions about "${selectedDocument.title}"...`
                  : "Ask a question or upload a document..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing || isLoading}
              size="icon"
            >
              {isLoading || isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 