export async function sendChatMessage(message: string) {
  const response = await fetch('http://localhost:8000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_id: null // We can add this later for conversation tracking
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
} 