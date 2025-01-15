"use client";

import { useState, useEffect } from "react";
import { ChatInput } from "./ui/chat-input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, X } from "lucide-react"; // Removed PenLine import
import { Button } from "./ui/button";
import { toast } from "sonner";
import { sendChatMessage } from "@/lib/api";
import { createConversation, addMessage, getConversation, deleteMessagesAfter } from "@/lib/supabase/db";
import { ChatHeader } from "./chat-header";

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
  type: 'quote';
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Load or create conversation
  useEffect(() => {
    let mounted = true;

    async function initConversation() {
      const initialQuery = localStorage.getItem("initialQuery");
      console.log("Starting conversation with query:", initialQuery);
      
      try {
        // Always create new conversation if there's an initial query
        if (initialQuery && mounted) {
          const conversation = await createConversation(
            `Chat about: ${initialQuery.slice(0, 30)}...`
          );
          
          if (!mounted) return; // Check if still mounted
          
          setConversationId(conversation.id);
          sessionStorage.setItem("currentConversationId", conversation.id);
          
          if (conversation.id) {
            // Add user message first
            const userMessage = await addMessage(conversation.id, "user", initialQuery);
            
            if (!mounted) return;
            
            setMessages(prev => [...prev, {
              ...userMessage,
              timestamp: new Date(userMessage.created_at)
            }]);

            // Get AI response
            const response = await sendChatMessage(initialQuery);
            
            if (!mounted) return;
            
            // Add AI message
            const aiMessage = await addMessage(
              conversation.id,
              "assistant",
              response.content,
              response.thinking_steps
            );

            setMessages(prev => [...prev, {
              ...aiMessage,
              timestamp: new Date(aiMessage.created_at)
            }]);

            // Clear initial query after processing
            localStorage.removeItem("initialQuery");
          }
        } else if (mounted) {
          // Load existing conversation or create new one
          const savedId = sessionStorage.getItem("currentConversationId");
          if (savedId) {
            const conversation = await getConversation(savedId);
            
            if (!mounted) return;
            
            setConversationId(savedId);
            setMessages(conversation.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.created_at)
            })));
          } else {
            const conversation = await createConversation("New Chat");
            
            if (!mounted) return;
            
            setConversationId(conversation.id);
            sessionStorage.setItem("currentConversationId", conversation.id);
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to initialize conversation:', error);
          toast.error("Failed to start conversation");
        }
      }
    }

    initConversation();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array

  const handleSubmit = async (value: string, file?: File) => {
    if (!conversationId || isProcessing) return;
    setIsProcessing(true);

    try {
      // Handle file upload if present
      let messageContent = value;
      if (file) {
        messageContent = `${value} [File: ${file.name}]`;
      }

      // Add user message
      const userMessage = await addMessage(conversationId, "user", messageContent);
      setMessages(prev => [...prev, {
        ...userMessage,
        timestamp: new Date(userMessage.created_at)
      }]);

      // Create placeholder for AI response with thinking steps
      const aiPlaceholder: Message = {
        id: crypto.randomUUID(),
        content: "",
        role: "assistant",
        timestamp: new Date(),
        thinking: []
      };
      setMessages(prev => [...prev, aiPlaceholder]);

      // Get AI response with streaming thinking steps
      const response = await sendChatMessage(messageContent);
      
      // Add final AI message
      const aiMessage = await addMessage(
        conversationId, 
        "assistant", 
        response.content,
        response.thinking_steps
      );

      // Update messages with final response
      setMessages(prev => prev.map(msg => 
        msg.id === aiPlaceholder.id ? {
          ...aiMessage,
          timestamp: new Date(aiMessage.created_at)
        } : msg
      ));

    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to send message");
    } finally {
      setIsProcessing(false);
      setQuoteData(null);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleRetry = async (messageId: string) => {
    if (!conversationId || isProcessing) return;
    setIsProcessing(true);

    try {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1 && messageIndex > 0) {
        const userMessage = messages[messageIndex - 1];
        
        // Remove messages from this point onwards in UI and DB
        setMessages(prev => prev.slice(0, messageIndex));
        await deleteMessagesAfter(conversationId, messages[messageIndex - 1].id);

        // Get new AI response
        const response = await sendChatMessage(userMessage.content);
        
        // Add new AI message to DB
        const aiMessage = await addMessage(
          conversationId,
          "assistant",
          response.content,
          response.thinking_steps
        );

        // Update UI with new AI message
        setMessages(prev => [...prev, {
          ...aiMessage,
          timestamp: new Date(aiMessage.created_at)
        }]);
      }
    } catch (error) {
      console.error('Error retrying:', error);
      toast.error("Failed to retry");
    } finally {
      setIsProcessing(false);
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
      {conversationId && (
        <ChatHeader 
          conversationId={conversationId} 
          initialTitle={messages[0]?.content.slice(0, 50) || "New Chat"} 
        />
      )}
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
                        ) : null} {/* Removed PenLine button */}
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
                <p className="text-xs text-muted-foreground mb-1">Quote:</p>
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
          <ChatInput
            onSubmit={handleSubmit}
            placeholder="Message Binod..."
            className="font-sans"
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