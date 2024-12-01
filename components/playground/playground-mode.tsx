"use client";

import React from "react";
import { ChatInterface } from "../chat/chat-interface";
import { PlaygroundSettings, type Settings } from "./playground-settings";
import { useChat } from "../../hooks/use-chat";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

export interface PlaygroundModeProps {}

export function PlaygroundMode({}: PlaygroundModeProps) {
  const { messages, sendMessage, isLoading, updateSettings } = useChat();
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(false);
  const [settings, setSettings] = React.useState<Settings>({
    temperature: 0.7,
    maxTokens: 2000,
    stream: true,
    useContext: true,
    useHistory: true,
    model: "gpt-4",
    systemPrompt: "You are a helpful legal assistant...",
  });

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    
    try {
      // TODO: Replace with actual settings update
      updateSettings?.({ [key]: value });
      toast.success("Settings updated", {
        description: `${key} has been updated to ${value}`
      });
    } catch (error) {
      console.error("Settings update error:", error);
      toast.error("Failed to update settings", {
        description: "An error occurred while updating settings. Please try again."
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message, settings);
    } catch (error) {
      console.error("Message send error:", error);
      toast.error("Failed to send message", {
        description: "An error occurred while sending the message. Please try again."
      });
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col p-4">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          className="h-full w-full"
        />
      </div>

      <div className={cn(
        "flex transition-all duration-300",
        isPanelCollapsed ? "w-10" : "w-[300px]"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="shrink-0"
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            !isPanelCollapsed && "rotate-180"
          )} />
        </Button>
        {!isPanelCollapsed && (
          <div className="border-l flex-1">
            <ScrollArea className="h-full">
              <PlaygroundSettings
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
} 