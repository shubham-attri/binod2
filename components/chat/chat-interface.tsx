import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import type { Message } from "../../hooks/use-chat";

interface ChatInterfaceProps {
  className?: string;
  onSendMessage?: (message: string) => Promise<void>;
  isLoading?: boolean;
  messages?: Message[];
  actions?: React.ReactNode;
}

export function ChatInterface({
  className,
  onSendMessage,
  isLoading = false,
  messages = [],
  actions
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput("");
    
    if (onSendMessage) {
      await onSendMessage(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={cn("flex h-[600px] flex-col", className)}>
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-4"
      >
        <div className="space-y-4" ref={scrollRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-max max-w-[80%] flex-col rounded-lg px-4 py-2 text-sm",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.sender && (
                <div
                  className={cn(
                    "text-xs font-medium mb-1",
                    message.role === "user"
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {message.sender}
                </div>
              )}
              <MarkdownRenderer 
                content={message.content}
                className={cn(
                  message.role === "user"
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              />
              <div
                className={cn(
                  "mt-1 text-xs",
                  message.role === "user"
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground"
                )}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex w-max max-w-[80%] flex-col rounded-lg bg-muted px-4 py-2 text-sm">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 delay-150" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 delay-300" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 border-t p-4 pb-6">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1"
        />
        {actions}
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          size="icon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </Card>
  );
} 