"use client";

import { Sidebar } from "@/components/sidebar";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-background font-noto-sans">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
} 