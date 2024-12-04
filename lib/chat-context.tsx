"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage } from './types';
import { apiClient } from './api-client';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setStreamingMessage('');

      // Add user message
      const userMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Create placeholder for assistant message
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Get AI response with streaming
      await apiClient.sendMessage(content, (chunk) => {
        setStreamingMessage(prev => prev + chunk);
        // Update the last message (assistant's message)
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = newMessages[newMessages.length - 1].content + chunk;
          return newMessages;
        });
      });

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      throw err;
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingMessage('');
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
      }}
    >
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