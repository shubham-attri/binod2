"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getConversations } from "@/lib/supabase/db";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    }

    loadConversations();
  }, []);

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Chat History</h1>
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => router.push(`/chat?id=${conversation.id}`)}
            className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-medium">{conversation.title}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(conversation.created_at).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
} 