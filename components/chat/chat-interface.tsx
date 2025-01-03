"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import type { ChatMessage } from "../../lib/types";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/lib/chat-context";
import { Send } from "lucide-react";
import { DocumentPanel } from "@/components/research/document-panel";

interface ChatInterfaceProps {
  className?: string;
  mode?: 'research' | 'case';
  caseId?: string;
}

export function ChatInterface({ className, mode = 'research', caseId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;
    
    const message = input.trim();
    setInput("");
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={cn("flex h-[600px] flex-col", className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {mode === 'case' ? 'Case Assistant' : 'Research Assistant'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <DocumentPanel caseId={mode === 'case' ? caseId : undefined} />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4" ref={scrollRef}>
          {messages.map((message: ChatMessage) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="mb-1 text-xs font-medium">
                  {message.role === "user" ? user?.email : "Agent Binod"}
                </div>
                <MarkdownRenderer content={message.content} />
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t p-4">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || !user}
          className="flex-1"
        />

        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || !user}
          size="icon"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </Card>
  );
} 