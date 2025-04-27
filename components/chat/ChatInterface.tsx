"use client";

import { useState, useEffect, useRef } from "react";
import { ChatInput } from "@/components/ui/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, X, ChevronDown, ChevronUp } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendChatMessage, uploadDocument } from "@/lib/api/api";
import { createConversation, addMessage, getConversation, deleteMessagesAfter, getThreadDocuments } from "@/lib/supabase/db";
import { ChatHeader } from "@/components/chat/chat-header";
import { Document } from "@/lib/supabase/types";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  thinking?: string[];
  files?: File[];
}

interface QuoteData {
  content: string;
  messageId: string;
  type: 'quote';
  isCollapsed: boolean;
}

// Update the addMessage function call to handle multiple files
const addMessageWithFiles = async (
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  thinking_steps?: string[],
  files?: File[]
) => {
  const message = await addMessage(conversationId, role, content, thinking_steps);
  return { ...message, files };
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [title, setTitle] = useState("New Chat");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedMessages(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation or create new one from initial query
  useEffect(() => {
    let mounted = true;

    async function initConversation() {
      const savedId = sessionStorage.getItem("currentConversationId");
      const initialQuery = localStorage.getItem("initialQuery");

      try {
        if (initialQuery && !savedId) {
          // Create new conversation from initial query
          const conversation = await createConversation(initialQuery.slice(0, 30) + "...");
          if (!mounted) return;

          setConversationId(conversation.id);
          setTitle(conversation.title);
          sessionStorage.setItem("currentConversationId", conversation.id);

          // Add initial messages
          const userMessage = await addMessage(conversation.id, "user", initialQuery);
          setMessages(prev => [...prev, {
            ...userMessage,
            timestamp: new Date(userMessage.created_at)
          }]);

          const response = await sendChatMessage(initialQuery);
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

          localStorage.removeItem("initialQuery");
        } else if (savedId) {
          // Load existing conversation
          const conversation = await getConversation(savedId);
          if (!mounted) return;

          setConversationId(savedId);
          setTitle(conversation.title);
          setIsFavorite(conversation.is_favorite);
          // Sort messages by timestamp for proper Q/A pairing
          const sortedMsgs = conversation.messages
            .map((msg: any) => ({ ...msg, timestamp: new Date(msg.created_at) }))
            .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());
          setMessages(sortedMsgs);
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        toast.error("Failed to start conversation");
      }
    }

    initConversation();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (conversationId) {
      const loadDocuments = async () => {
        try {
          const docs = await getThreadDocuments(conversationId);
          setDocuments(docs);
        } catch (error) {
          console.error("Failed to load documents:", error);
        }
      };
      loadDocuments();
    }
  }, [conversationId]);

  const handleSubmit = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    if (!conversationId) return;
    
    setIsProcessing(true);

    try {
      // Handle file uploads if present
      const fileUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const { file_url, ingested_chunks } = await uploadDocument(conversationId, file);
          toast.success(`Ingested ${ingested_chunks} chunks from ${file.name}`);
          fileUrls.push(file_url);
        }
        // Refresh document list
        const docs = await getThreadDocuments(conversationId);
        setDocuments(docs);
      }

      // Add user message
      const userMessage = await addMessageWithFiles(
        conversationId,
        "user",
        content.trim(),
        undefined,
        files
      );

      setMessages(prev => [...prev, {
        ...userMessage,
        timestamp: new Date(userMessage.created_at)
      }]);

      if (content.trim()) {
        // Create temporary message for showing thinking steps
        const tempMessage = {
          id: 'temp-' + Date.now(),
          content: '',
          role: 'assistant' as const,
          timestamp: new Date(),
          thinking: [] as string[]
        };
        
        setMessages(prev => [...prev, tempMessage]);

        // Start streaming response
        const response = await sendChatMessage(
          content, 
          fileUrls.join(','), // Join URLs with comma
          quoteData?.content
        );
        
        // Update thinking steps in real time
        if (response.thinking_steps?.length) {
          setMessages(prev => 
            prev.map(m => 
              m.id === tempMessage.id 
                ? { ...m, thinking: response.thinking_steps }
                : m
            )
          );
        }

        // Add final AI message
        const aiMessage = await addMessage(
          conversationId,
          "assistant",
          response.content,
          response.thinking_steps
        );

        // Replace temp message with final
        setMessages(prev => 
          prev.map(m => 
            m.id === tempMessage.id 
              ? { ...aiMessage, timestamp: new Date(aiMessage.created_at) }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Error in chat:", error);
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
        type: 'quote',
        isCollapsed: false
      });
    }
  };

  const handleDocumentsUpdate = (newDocuments: Document[]) => {
    setDocuments(newDocuments);
  };

  // Update title when it changes
  const handleTitleUpdate = (newTitle: string) => {
    setTitle(newTitle);
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      {conversationId && (
        <ChatHeader 
          conversationId={conversationId} 
          title={title}
          isFavorite={isFavorite}
          documents={documents}
          onDocumentsUpdate={handleDocumentsUpdate}
          onTitleUpdate={handleTitleUpdate}
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
                <div className="flex-1 min-w-0 overflow-hidden">
                  {message.thinking ? (
                    <div className="space-y-2">
                      {message.thinking.map((step, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-pulse" />
                          <TextShimmer duration={2} className="break-words whitespace-pre-wrap">{step}</TextShimmer>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {message.role === 'user' ? (
                        <>
                          <p className={"text-sm text-foreground break-words whitespace-pre-wrap " + (expandedMessages.has(message.id) ? "" : "max-h-12 overflow-hidden")}>
                            {message.content}
                          </p>
                          {!expandedMessages.has(message.id) && message.content.length > 100 && (
                            <button className="text-xs text-primary mt-1" onClick={() => toggleExpanded(message.id)}>
                              Read more
                            </button>
                          )}
                          {expandedMessages.has(message.id) && (
                            <button className="text-xs text-primary mt-1" onClick={() => toggleExpanded(message.id)}>
                              Show less
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                      <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleCopy(message.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {message.role === "assistant" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleRetry(message.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="flex-none px-4 py-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-2 mb-2">
            {quoteData && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border" />
                <div className="pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Quote:</p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setQuoteData(prev => 
                          prev ? { ...prev, isCollapsed: !prev.isCollapsed } : null
                        )}
                      >
                        {quoteData.isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setQuoteData(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {!quoteData.isCollapsed && (
                    <div className="flex items-start gap-2">
                      <p className="text-sm flex-1 text-foreground/80 break-words whitespace-pre-wrap">
                        {quoteData.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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