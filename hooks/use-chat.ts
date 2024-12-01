import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { ChatMessage } from "@/lib/types";

interface UseChatOptions {
  onError?: (error: Error) => void;
  onResponse?: (response: any) => void;
  onFinish?: () => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [contextId, setContextId] = useState<string | null>(null);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Add user message immediately
        const userMessage: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          content,
          role: "user",
          created_at: new Date().toISOString(),
        };
        addMessage(userMessage);

        // Send message to API
        const response = await apiClient.sendMessage(content, contextId || undefined);
        
        // Update context ID if not set
        if (!contextId) {
          setContextId(response.context_id);
        }

        // Add assistant message
        addMessage(response.message);

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
    [contextId, addMessage, options]
  );

  const streamMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Add user message immediately
        const userMessage: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          content,
          role: "user",
          created_at: new Date().toISOString(),
        };
        addMessage(userMessage);

        // Create assistant message placeholder
        const assistantMessage: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          content: "",
          role: "assistant",
          created_at: new Date().toISOString(),
        };
        addMessage(assistantMessage);

        // Stream response
        await apiClient.streamMessage(
          content,
          contextId || undefined,
          (chunk) => {
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: lastMessage.content + chunk },
                ];
              }
              return prev;
            });
          }
        );

        options.onFinish?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [contextId, addMessage, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setContextId(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    streamMessage,
    clearMessages,
    contextId,
  };
} 