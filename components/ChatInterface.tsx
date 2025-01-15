"use client";

import { useState } from "react";
import { AIInputWithLoading } from "./ui/ai-input-with-loading";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, PenLine, X } from "lucide-react";
import { Button } from "./ui/button";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface QuoteData {
  content: string;
  messageId: string;
  type: 'edit' | 'quote';
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

  const handleSubmit = async (value: string, editingId?: string) => {
    if (editingId) {
      const editedMessageIndex = messages.findIndex(m => m.id === editingId);
      if (editedMessageIndex !== -1) {
        setMessages(prev => prev.slice(0, editedMessageIndex));
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: value,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setEditingMessageId(null);
    setQuoteData(null);

    setTimeout(() => {
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: `This is a simulated response to: "${value}"`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 2000);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRetry = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1 && messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      setMessages(prev => prev.slice(0, messageIndex));
      handleSubmit(userMessage.content);
    }
  };

  const handleEdit = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setQuoteData({
        content: message.content,
        messageId: message.id,
        type: 'edit'
      });
    }
  };

  const handleQuoteSelect = (messageId: string) => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      setQuoteData({
        content: selection,
        messageId,
        type: 'quote'
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="max-w-2xl mx-auto">
          {messages.map((message, index) => (
            <div key={message.id}>
              <div 
                className="flex gap-4 py-2 group relative"
                onMouseUp={() => message.role === "assistant" && handleQuoteSelect(message.id)}
              >
                {/* Vertical connection line */}
                {message.role === "assistant" && (
                  <div 
                    className="absolute left-4 top-0 w-[2px] bg-border" 
                    style={{ 
                      height: '28px',
                      top: '-12px'
                    }} 
                  />
                )}
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10">
                  {message.role === "assistant" ? (
                    <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center text-background text-sm font-bold">
                      B
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{message.content}</p>
                  <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(message.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {message.role === "assistant" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRetry(message.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEdit(message.id)}
                      >
                        <PenLine className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="flex-none px-4 py-4 bg-background">
        <div className="max-w-2xl mx-auto">
          {quoteData && (
            <div className="relative mb-2">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border" />
              <div className="pl-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {quoteData.type === 'edit' ? 'Editing message:' : 'Quote:'}
                </p>
                <div className="flex items-start gap-2">
                  <p className="text-sm flex-1 text-foreground/80">
                    {quoteData.content}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 -mt-1"
                    onClick={() => setQuoteData(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <AIInputWithLoading
            onSubmit={(value) => handleSubmit(value, quoteData?.type === 'edit' ? quoteData.messageId : undefined)}
            placeholder="Message Binod..."
            className="font-sans [&>textarea]:rounded-lg"
            minHeight={64}
            maxHeight={200}
            initialValue={quoteData?.type === 'edit' ? quoteData.content : ''}
          />
          <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground">
              Binod may make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 