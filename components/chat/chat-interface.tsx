"use client";

import { useState, useEffect, useRef } from "react";
import { Send, FileText, Plus, Edit } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message } from "@/types/chat";
import { streamChatResponse, persistMessages, loadPersistedMessages } from "@/lib/chat-service";
import { Loader2 } from "lucide-react";

interface ChatInterfaceProps {
  onCreateDocument?: () => void;
  onUpdateDocument?: (message: string) => void;
  showCreateDocument?: boolean;
  selectedDocument?: {
    id: string;
    title: string;
    content: string;
  } | null;
  initialMessages?: Message[];
}

export function ChatInterface({ 
  onCreateDocument, 
  onUpdateDocument,
  showCreateDocument,
  selectedDocument,
  initialMessages = []
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentResponse, setCurrentResponse] = useState<string>("");

  // Load persisted messages
  useEffect(() => {
    const persistedMessages = loadPersistedMessages();
    if (persistedMessages.length > 0) {
      setMessages(persistedMessages);
    }
  }, []);

  // Initialize with initial messages when they change
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
      // Optionally trigger the AI response here
      handleSend();
    }
  }, [initialMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: "smooth",
          block: "end",
        });
      }
    };

    // Add a small delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, currentResponse]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      persistMessages(newMessages);
      return newMessages;
    });
    setInput("");
    setIsLoading(true);
    setIsTyping(true);
    setCurrentResponse("");

    try {
      await streamChatResponse(
        [...messages, userMessage],
        selectedDocument?.id,
        (chunk) => {
          setCurrentResponse(prev => prev + chunk);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === "assistant") {
              lastMessage.content = prev + chunk;
            } else {
              newMessages.push({
                id: Date.now().toString(),
                role: "assistant",
                content: chunk,
                createdAt: new Date(),
              });
            }
            return newMessages;
          });
        },
        (error) => {
          console.error("Error:", error);
          // Add error toast here
        },
        () => {
          setIsTyping(false);
          setIsLoading(false);
          setCurrentResponse("");
          persistMessages(messages);
        }
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);
      setIsTyping(false);
      setCurrentResponse("");
    }
  };

  // Suggestions for document creation
  const suggestions = [
    "Create a document for a legal contract",
    "Draft a legal memo about...",
    "Generate a summary document",
    "Prepare a legal analysis",
  ];

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col flex-1 p-4">
        {/* Messages container with improved scrolling */}
        <div 
          className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4 scroll-smooth"
          style={{
            maxHeight: "calc(100vh - 200px)", // Adjust based on your layout
            scrollbarWidth: "thin",
            scrollbarGutter: "stable",
          }}
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && currentResponse && (
            <ChatMessage
              message={{
                id: "typing",
                role: "assistant",
                content: currentResponse,
                createdAt: new Date(),
              }}
            />
          )}
          {/* Invisible div for scroll targeting */}
          <div 
            ref={messagesEndRef}
            style={{ height: "1px", visibility: "hidden" }}
            aria-hidden="true"
          />
        </div>

        {/* Input area with suggestions */}
        <div className="border-t pt-4 mt-4 bg-background sticky bottom-0">
          <form onSubmit={handleSend} className="space-y-4">
            {messages.length === 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="whitespace-nowrap"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {showCreateDocument && (
                    <DropdownMenuItem onClick={onCreateDocument}>
                      <FileText className="h-4 w-4 mr-2" />
                      New Document
                    </DropdownMenuItem>
                  )}
                  {selectedDocument && (
                    <DropdownMenuItem 
                      onClick={() => {
                        setInput(`Update the document "${selectedDocument.title}" to `);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Document
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Input
                placeholder={selectedDocument 
                  ? `Update "${selectedDocument.title}" or ask a question...`
                  : "Ask your legal question..."
                }
                value={input}
                onChange={handleInputChange}
                className="flex-1"
              />
              <Button 
                type="submit"
                disabled={isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
} 