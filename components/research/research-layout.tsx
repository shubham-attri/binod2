"use client";

import React from "react";
import { ChatInterface } from "../chat/chat-interface";
import { useChat } from "@/hooks/use-chat";

interface ResearchLayoutProps {
  className?: string;
}

export function ResearchLayout({ className }: ResearchLayoutProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  return (
    <div className="h-full">
      {/* Main Chat Area */}
      <ChatInterface
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
        className="h-full"
      />
    </div>
  );
} 