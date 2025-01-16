"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HistoryItem } from "./history-item";
import { getConversations } from "@/lib/supabase/db";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  first_message?: string;
  updated_at: string;
  messages: Array<{
    content: string;
    role: 'user' | 'assistant';
    created_at: string;
  }>;
}

export function HistoryInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-background font-noto-sans">
      {/* Search Header */}
      <div className="flex-none p-4 border-b ">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a chat..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-2xl mx-auto py-4 space-y-4">
          {filteredConversations.map((conversation) => (
            <HistoryItem
              key={conversation.id}
              conversation={conversation}
              lastActivity={formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
              onUpdate={loadConversations}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 