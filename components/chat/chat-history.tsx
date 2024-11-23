"use client";

import { useEffect, useState } from "react";
import { ChatInterface } from "./chat-interface";
import { Message } from "@/types/chat";
import { loadPersistedMessages } from "@/lib/chat-service";

interface ChatHistoryProps {
  chatId: string;
}

export function ChatHistory({ chatId }: ChatHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load chat history for specific chat
    const loadChat = async () => {
      try {
        // TODO: Replace with actual API call to load specific chat
        const history = loadPersistedMessages();
        setMessages(history);
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatId]);

  if (isLoading) {
    return <div>Loading chat history...</div>;
  }

  return (
    <div className="h-full">
      <ChatInterface initialMessages={messages} />
    </div>
  );
} 