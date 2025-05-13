// WebSocket client for chat
class WebSocketChatClient {
  private ws: WebSocket | null = null;
  private messageQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private thinking_steps: string[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket('ws://localhost:8000/chat');
    
    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'thinking_step') {
        this.thinking_steps.push(data.content);
      } else if (data.type === 'response') {
        const currentMessage = this.messageQueue.shift();
        if (currentMessage) {
          currentMessage.resolve({
            content: data.content,
            thinking_steps: this.thinking_steps
          });
          this.thinking_steps = [];
        }
      } else if (data.type === 'error') {
        const currentMessage = this.messageQueue.shift();
        if (currentMessage) {
          currentMessage.reject(new Error(data.content));
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      const currentMessage = this.messageQueue.shift();
      if (currentMessage) {
        currentMessage.reject(new Error('WebSocket error'));
      }
    };
  }

  async sendMessage(content: string, fileUrl?: string, quote?: string) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    // Debug log for quote data
    if (quote) {
      console.log('WebSocketChatClient: Sending message with quote:', quote);
    }
    
    const payload = { content, fileUrl, quote };
    console.log('WebSocketChatClient: Sending payload:', payload);

    return new Promise((resolve, reject) => {
      this.messageQueue.push({ resolve, reject });
      this.ws?.send(JSON.stringify(payload));
    });
  }
}

const wsClient = new WebSocketChatClient();

export async function sendChatMessage(
  content: string, 
  fileUrl?: string,
  quote?: string
) {
  try {
    const response = await wsClient.sendMessage(content, fileUrl, quote);
    return response;
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
} 
export async function uploadDocument(
  conversationId: string,
  file: File
): Promise<{ file_url: string; ingested_chunks: number }> {
  const form = new FormData()
  form.append("conversation_id", conversationId)
  form.append("file", file)
  const res = await fetch("http://localhost:8000/upload-document", {
    method: "POST",
    body: form,
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}
