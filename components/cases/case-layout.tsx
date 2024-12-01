import React from "react";
import { ChatInterface } from "../chat/chat-interface";
import { CasePanel } from "./case-panel";
import { CaseContext } from "./case-context";
import { useChat } from "@/hooks/use-chat";

interface CaseLayoutProps {
  className?: string;
}

export function CaseLayout({ className }: CaseLayoutProps) {
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
    <div className="grid h-full grid-cols-[1fr,400px] gap-4">
      {/* Main Chat Area */}
      <div className="flex flex-col">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          className="flex-1"
        />
      </div>

      {/* Case Panel */}
      <div className="border-l">
        <CasePanel />
      </div>
    </div>
  );
} 