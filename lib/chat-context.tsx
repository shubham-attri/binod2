"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { ChatMessage } from "./types";

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Add debug effect
  useEffect(() => {
    console.log('ChatProvider Mounted:', {
      messageCount: messages.length,
      isLoading
    });
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    console.log('ChatContext: Starting sendMessage', { content });
    try {
      setIsLoading(true);
      console.log('ChatContext: Set loading true');
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        role: 'user',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      console.log('ChatContext: Added user message');

      // Send to backend
      const token = localStorage.getItem('auth_token');
      console.log('ChatContext: Got token', { hasToken: !!token });
      
      const response = await fetch(`${BACKEND_URL}/api/v1/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: content })
      });
      console.log('ChatContext: Got response', { status: response.status });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        content: data.response,
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('ChatContext: Error in sendMessage:', error);
      throw error;
    } finally {
      console.log('ChatContext: Setting loading false');
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return (
    <ChatContext.Provider value={{ messages, isLoading, sendMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 