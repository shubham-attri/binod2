"use client";

import { useState, useEffect } from "react";
import { AIInputWithLoading } from "./ui/ai-input-with-loading";
import { ScrollArea } from "./ui/scroll-area";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, PenLine, X } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  thinking?: string[];
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle initial query on mount
  useEffect(() => {
    const initialQuery = sessionStorage.getItem("initialQuery");
    if (initialQuery) {
      handleSubmit(initialQuery);
      // Clear the initial query but keep chatStarted flag
      sessionStorage.removeItem("initialQuery");
    }
  }, []);

  const handleSubmit = async (value: string, editingId?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

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

    // Simulate AI thinking process
    const aiMessage: Message = {
      id: crypto.randomUUID(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
      thinking: [
        "Analyzing query context...",
        "Retrieving relevant information...",
        "Formulating response...",
      ]
    };
    
    setMessages(prev => [...prev, aiMessage]);

    // Simulate thinking steps
    for (let i = 0; i < aiMessage.thinking!.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, thinking: msg.thinking?.slice(0, i + 1) }
          : msg
      ));
    }

    // Simulate final response
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { 
              ...msg, 
              content: `This is a simulated response to: "${value}"`,
              thinking: undefined
            }
          : msg
      ));
      setIsProcessing(false);
    }, 1000);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
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
                {/* Connection line */}
                {message.role === "assistant" && (
                  <div 
                    className="absolute left-4 top-0 w-[2px] bg-border" 
                    style={{ height: '28px', top: '-12px' }} 
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
                  {message.thinking ? (
                    <div className="space-y-2">
                      {message.thinking.map((step, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-pulse" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
            disabled={isProcessing}
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