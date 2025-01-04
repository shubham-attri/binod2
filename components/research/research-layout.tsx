"use client";

import React from "react";
import { ChatInterface } from "../chat/chat-interface";
import { useChat } from "@/hooks/use-chat";
import { DocumentDialog } from "./document-dialog";

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
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-lg font-semibold">Research Assistant</h1>
        <DocumentDialog />
      </div>
      {/* Main Chat Area */}
      <ChatInterface
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
        className="h-[calc(100%-57px)]"
      />
    </div>
  );
} 