import React from "react";
import { ChatInterface } from "../chat/chat-interface";
import { useChat } from "@/hooks/use-chat";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaygroundSettings } from "./playground-settings";
import { PlaygroundContext } from "./playground-context";

interface PlaygroundLayoutProps {
  className?: string;
}

export function PlaygroundLayout({ className }: PlaygroundLayoutProps) {
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

      {/* Settings Panel */}
      <div className="border-l">
        <Card className="h-full">
          <Tabs defaultValue="settings" className="h-full">
            <div className="border-b px-4 py-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="settings" className="p-4">
              <PlaygroundSettings />
            </TabsContent>
            <TabsContent value="history" className="p-4">
              <div className="text-sm text-muted-foreground">
                Chat history will be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 