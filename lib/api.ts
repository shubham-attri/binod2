export async function sendChatMessage(content: string, fileUrl?: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      content,
      fileUrl 
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      const data = JSON.parse(line);
      if (data.type === "thinking_step") {
        thinking_steps.push(data.content);
      } else if (data.type === "response") {
        finalResponse = data;
      }
    }
  }

  if (!finalResponse) throw new Error("No response received");

  return {
    content: finalResponse.content,
    thinking_steps: finalResponse.thinking_steps
  };
} 