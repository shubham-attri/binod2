"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send } from "lucide-react";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { apiClient } from '@/lib/api-client';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const handleSend = async () => {
    console.log('Chat Interface: Send attempt', { input });
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput("");
    
    try {
      setIsLoading(true);
      
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      console.log('Chat Interface: Calling API client');
      const response = await apiClient.sendMessage(message);
      console.log('Chat Interface: API response', response);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        content: response.response,
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat Interface: Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("flex h-[600px] flex-col", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg p-4 max-w-[80%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 flex gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading}
          size="icon"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </Card>
  );
} 