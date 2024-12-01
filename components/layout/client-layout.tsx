"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ChatProvider } from "@/lib/chat-context";
import ProtectedRoute from "@/components/protected-route";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ChatProvider>
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </ChatProvider>
    </AuthProvider>
  );
} 