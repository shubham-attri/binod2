"use client";

import { Sidebar, SidebarBody } from "@/components/sidebar";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarBody />
      </Sidebar>
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
} 