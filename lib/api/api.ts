export async function sendChatMessage(
  content: string, 
  fileUrl?: string,
  quote?: string
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      content,
      fileUrl,
      quote 
    })
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  const thinking_steps: string[] = [];
  let finalResponse = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === "thinking_step") {
            thinking_steps.push(data.content);
            // You could emit an event or callback here for real-time updates
          } else if (data.type === "response") {
            finalResponse = data;
          }
        } catch (e) {
          console.error('Failed to parse line:', line, e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!finalResponse) throw new Error("No response received");

  return {
    content: finalResponse.content,
    thinking_steps: finalResponse.thinking_steps
  };
} 