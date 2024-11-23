import { Message } from "@/types/chat";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function streamChatResponse(
  messages: Message[],
  documentId?: string,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void,
  onDone: () => void
) {
  try {
    const response = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        documentId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No reader available");
    }

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (buffer) {
          onChunk(buffer);
        }
        onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onDone();
          } else {
            onChunk(data);
          }
        }
      }
    }
  } catch (error) {
    onError(error as Error);
  }
}

export async function persistMessages(messages: Message[]) {
  try {
    const messagesToStore = messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
    }));
    localStorage.setItem("chat_history", JSON.stringify(messagesToStore));
  } catch (error) {
    console.error("Error persisting messages:", error);
  }
}

export function loadPersistedMessages(): Message[] {
  const stored = localStorage.getItem("chat_history");
  if (!stored) return [];
  
  try {
    const messages = JSON.parse(stored);
    return messages.map((msg: Message) => ({
      ...msg,
      createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
    }));
  } catch (error) {
    console.error("Error loading messages:", error);
    return [];
  }
}

export async function evaluateResponses() {
  const response = await fetch(`${API_URL}/api/evaluate`, {
    method: "POST",
  });
  
  if (!response.ok) {
    throw new Error("Failed to run evaluation");
  }
  
  return response.json();
} 