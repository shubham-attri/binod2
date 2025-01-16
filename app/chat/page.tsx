"use client";

import { Sidebar, SidebarBody, SidebarProvider } from "@/components/sidebar";

export default function ChatPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarBody />
        </Sidebar>
        <main className="flex-1 overflow-hidden">
          {/* Your chat content */}
        </main>
      </div>
    </SidebarProvider>
  );
} 