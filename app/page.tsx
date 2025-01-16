"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/ui/chat-input";
import { RetroGrid } from "@/components/ui/retro-grid";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const router = useRouter();

  const handleSubmit = async (query: string) => {
    if (!query.trim()) return;
    
    // Clear any existing conversation
    sessionStorage.removeItem("currentConversationId");
    
    // Store query and redirect
    localStorage.setItem("initialQuery", query);
    router.push('/chat');
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4">
      <RetroGrid className="opacity-20" />
      
      <div className="w-full max-w-2xl space-y-8 z-10">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-medium">
            {getGreeting()}, User
          </h1>
          <p className="text-muted-foreground">
            How can Binod help you today?
          </p>
        </div>

        <ChatInput
          onSubmit={handleSubmit}
          placeholder="Send a message to start a new chat..."
          className="font-sans"
          minHeight={100}
          maxHeight={300}
        />
      </div>
    </main>
  );
}
