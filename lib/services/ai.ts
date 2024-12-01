import { AgentConfig } from '../agents/types';

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function generateResponse(
  prompt: string,
  config: AgentConfig
): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxResponseTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

export async function generateEmbedding(
  text: string,
  config: AgentConfig
): Promise<number[]> {
  try {
    const response = await fetch('/api/ai/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model: config.embedModelName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function streamResponse(
  prompt: string,
  config: AgentConfig,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxResponseTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  } catch (error) {
    console.error('Error streaming response:', error);
    throw error;
  }
} 