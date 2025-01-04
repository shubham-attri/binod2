"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ChatProvider } from "@/lib/chat-context";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </AuthProvider>
  );
} 