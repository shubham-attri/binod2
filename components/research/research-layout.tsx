import React from "react";
import { ChatInterface } from "../chat/chat-interface";
import { DocumentPanel } from "./document-panel";
import { ResearchContext } from "./research-context";
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
    <div className="grid h-full grid-cols-[1fr,320px] gap-4">
      {/* Main Chat Area */}
      <div className="flex flex-col">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          className="flex-1"
        />
      </div>

      {/* Document Panel */}
      <div className="border-l">
        <DocumentPanel />
      </div>
    </div>
  );
} 