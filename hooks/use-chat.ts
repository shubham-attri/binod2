import { useState, useCallback } from "react";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sender?: string;
}

interface UseChatOptions {
  onError?: (error: Error) => void;
  onResponse?: (response: any) => void;
  onFinish?: () => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addMessage = useCallback((content: string, role: "user" | "assistant", sender?: string) => {
    const message: Message = {
      id: Math.random().toString(36).substring(7),
      content,
      role,
      timestamp: new Date(),
      sender,
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const sendMessage = useCallback(
    async (content: string, sender?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Add user message
        addMessage(content, "user", sender);

        // TODO: Replace with actual API call
        const response = await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              content: "This is a mock response. Replace with actual API integration.",
              sender: "AI Assistant"
            });
          }, 1000);
        });

        // Add assistant message
        addMessage((response as any).content, "assistant", (response as any).sender);

        options.onResponse?.(response);
        options.onFinish?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMessages,
  };
} 